import * as vscode from 'vscode';
import * as treeify from 'treeify';

interface TreeNode {
	[key: string]: any;
}

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('ghost.spook', () => {
		if (vscode.workspace.workspaceFolders) {
			const workspaceFolder = vscode.workspace.workspaceFolders[0];
			displayFolderStructure(workspaceFolder.uri, context);
		} else {
			vscode.window.showErrorMessage('No workspace folder is opened.');
		}
	});

	context.subscriptions.push(disposable);
}

class FolderStructurePanel {
	public static currentPanel: FolderStructurePanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	private constructor(panel: vscode.WebviewPanel) {
		this._panel = panel;
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	public static createOrShow(extensionContext: vscode.ExtensionContext, structure: TreeNode) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (FolderStructurePanel.currentPanel) {
			FolderStructurePanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'folderStructure',
			`Ghost's View`,
			column || vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		FolderStructurePanel.currentPanel = new FolderStructurePanel(panel);
		FolderStructurePanel.currentPanel._update(structure);
	}

	private _update(structure: TreeNode) {
		this._panel.webview.html = this._getHtmlContent(structure);
	}

	private _getHtmlContent(structure: TreeNode): string {
		return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        background: #252526; 
                        color: #fff;
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    }
                    .tree-container {
                        padding: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="tree-container">
                    ${this._generateSvg(structure)}
                </div>
            </body>
            </html>
        `;
	}

	private _generateSvg(structure: TreeNode): string {
		const nodes = this._processStructure(structure);
		const svgHeight = nodes.length * 30 + 50;

		return `
            <svg width="800" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <!-- macOS folder gradient -->
                    <linearGradient id="folder-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#82b1ff"/>
                        <stop offset="100%" style="stop-color:#2979ff"/>
                    </linearGradient>

                    <!-- node_modules folder gradient -->
                    <linearGradient id="node-modules-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#9e9e9e"/>
                        <stop offset="100%" style="stop-color:#616161"/>
                    </linearGradient>
                    
                    <!-- Folder icon template -->
                    <g id="folder-icon">
                        <path d="M1,2 A1,1 0 0,1 2,1 H8 A1,1 0 0,1 9,2 H18 A1,1 0 0,1 19,3 V13 A1,1 0 0,1 18,14 H2 A1,1 0 0,1 1,13 Z"
                              fill="url(#folder-gradient)"
                              stroke="rgba(0,0,0,0.1)"
                              stroke-width="0.5"/>
                        <path d="M2,2 H18 V3 H2 Z" 
                              fill="rgba(255,255,255,0.2)"/>
                    </g>

                    <!-- node_modules folder icon -->
                    <g id="node-modules-icon">
                        <path d="M1,2 A1,1 0 0,1 2,1 H8 A1,1 0 0,1 9,2 H18 A1,1 0 0,1 19,3 V13 A1,1 0 0,1 18,14 H2 A1,1 0 0,1 1,13 Z"
                              fill="url(#node-modules-gradient)"
                              stroke="rgba(0,0,0,0.1)"
                              stroke-width="0.5"/>
                        <path d="M2,2 H18 V3 H2 Z" 
                              fill="rgba(255,255,255,0.2)"/>
                    </g>
                    
                    <!-- File icon template -->
                    <g id="file-icon">
                        <rect x="2" y="0" width="10" height="12" rx="1"
                              fill="#2b2b2b"
                              stroke="#666"
                              stroke-width="0.5"/>
                        <line x1="4" y1="3" x2="10" y2="3" stroke="#888" stroke-width="0.5"/>
                        <line x1="4" y1="6" x2="10" y2="6" stroke="#888" stroke-width="0.5"/>
                        <line x1="4" y1="9" x2="8" y2="9" stroke="#888" stroke-width="0.5"/>
                    </g>
                </defs>
                
                <!-- Tree structure -->
                ${this._generateTreeStructure(nodes)}
            </svg>
        `;
	}

	private _processStructure(structure: TreeNode, prefix: string = '', result: string[] = [], level: number = 0): string[] {
		Object.entries(structure).forEach(([key, value]) => {
			const path = prefix ? `${prefix}/${key}` : key;

			// Add the node_modules folder but don't process its contents
			if (key === 'node_modules') {
				result.push(`${level}:${path}:node_modules`);
				return;
			}

			result.push(`${level}:${path}:${value === null ? 'file' : 'folder'}`);

			if (value !== null && key !== 'node_modules') {
				this._processStructure(value, path, result, level + 1);
			}
		});
		return result;
	}

	private _generateTreeStructure(nodes: string[]): string {
		let result = '';
		const baseX = 50;
		const baseY = 40;
		const levelIndent = 30;
		const verticalSpacing = 30;

		// Generate connecting lines first
		result += '<g stroke="#4a4a4a" stroke-width="1">';
		nodes.forEach((node, index) => {
			const [level, path, type] = node.split(':');
			const x = baseX + (parseInt(level) * levelIndent);
			const y = baseY + (index * verticalSpacing);

			if (parseInt(level) > 0) {
				result += `
                    <line 
                        x1="${x - levelIndent + 10}" 
                        y1="${y - verticalSpacing + 15}"
                        x2="${x - levelIndent + 10}"
                        y2="${y + 7}"
                    />
                    <line
                        x1="${x - levelIndent + 10}"
                        y1="${y + 7}"
                        x2="${x}"
                        y2="${y + 7}"
                    />
                `;
			}
		});
		result += '</g>';

		// Generate icons and labels
		nodes.forEach((node, index) => {
			const [level, path, type] = node.split(':');
			const x = baseX + (parseInt(level) * levelIndent);
			const y = baseY + (index * verticalSpacing);
			const name = path.split('/').pop() || '';

			if (type === 'node_modules') {
				// Special handling for node_modules folder
				result += `
                    <use href="#node-modules-icon" transform="translate(${x}, ${y})"/>
                    <text x="${x + 25}" y="${y + 10}" 
                          fill="#9e9e9e" 
                          font-family="-apple-system, BlinkMacSystemFont, sans-serif" 
                          font-size="14">
                        ${name}/
                    </text>
                `;
			} else if (type === 'folder') {
				result += `
                    <use href="#folder-icon" transform="translate(${x}, ${y})"/>
                    <text x="${x + 25}" y="${y + 10}" 
                          fill="#fff" 
                          font-family="-apple-system, BlinkMacSystemFont, sans-serif" 
                          font-size="14">
                        ${name}/
                    </text>
                `;
			} else {
				result += `
                    <use href="#file-icon" transform="translate(${x}, ${y})"/>
                    <text x="${x + 25}" y="${y + 10}" 
                          fill="#fff" 
                          font-family="-apple-system, BlinkMacSystemFont, sans-serif" 
                          font-size="14">
                        ${name}
                    </text>
                `;
			}
		});

		return result;
	}

	private dispose() {
		FolderStructurePanel.currentPanel = undefined;
		this._panel.dispose();
		while (this._disposables.length) {
			const disposable = this._disposables.pop();
			if (disposable) {
				disposable.dispose();
			}
		}
	}
}

async function displayFolderStructure(folderUri: vscode.Uri, context: vscode.ExtensionContext) {
	try {
		const structure = await getFolderStructure(folderUri);
		FolderStructurePanel.createOrShow(context, structure);
	} catch (error) {
		console.error('Error reading folder structure:', error);
		vscode.window.showErrorMessage('Failed to read folder structure. Check the console for details.');
	}
}

async function getFolderStructure(folderUri: vscode.Uri): Promise<any> {
	const files = await vscode.workspace.fs.readDirectory(folderUri);
	const structure: { [key: string]: any } = {};

	for (const [name, type] of files) {
		// Skip expanding node_modules, just mark it as an empty folder
		if (name === 'node_modules' && type === vscode.FileType.Directory) {
			structure[name] = {};
			continue;
		}

		if (type === vscode.FileType.Directory) {
			structure[name] = await getFolderStructure(vscode.Uri.joinPath(folderUri, name));
		} else {
			structure[name] = null;
		}
	}

	return structure;
}