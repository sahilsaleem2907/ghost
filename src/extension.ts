import * as vscode from 'vscode';
import * as treeify from 'treeify'; // Import treeify for generating tree structures
import axios from 'axios'; // Import axios for making HTTP requests

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
	private readonly _extensionUri: vscode.Uri;

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Set the tab icon
		this._panel.iconPath = {
			light: vscode.Uri.joinPath(this._extensionUri, 'src', 'logos', 'ghost.svg'),
			dark: vscode.Uri.joinPath(this._extensionUri, 'src', 'logos', 'ghost.svg')
		};
	}

	public static createOrShow(extensionContext: vscode.ExtensionContext, structure: any) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (FolderStructurePanel.currentPanel) {
			FolderStructurePanel.currentPanel._panel.reveal(column);
			FolderStructurePanel.currentPanel._update(structure);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			'folderStructure',
			`Ghost's View`,
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.joinPath(extensionContext.extensionUri, 'src', 'logos')
				]
			}
		);

		FolderStructurePanel.currentPanel = new FolderStructurePanel(panel, extensionContext.extensionUri);
		FolderStructurePanel.currentPanel._update(structure);
	}

	private _update(structure: any) {
		this._panel.webview.html = this._getHtmlContent(structure);
	}

	private _getHtmlContent(structure: any): string {
		if (structure.loading) {
			return `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { 
                            background: #252526; 
                            color: #fff;
                            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                            margin: 0;
                            padding: 20px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                        }
                        .loader-container {
                            text-align: center;
                        }
                        .loader {
                            display: inline-block;
                            width: 50px;
                            height: 50px;
                            border: 3px solid rgba(255,255,255,.3);
                            border-radius: 50%;
                            border-top-color: #fff;
                            animation: spin 1s ease-in-out infinite;
                            margin-bottom: 20px;
                        }
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                        .loader-text {
                            font-size: 16px;
                            color: #fff;
                            margin-top: 15px;
                        }
                    </style>
                </head>
                <body>
                    <div class="loader-container">
                        <div class="loader"></div>
                        <div class="loader-text">
                            ${structure.message || 'Analyzing folder structure...'}
                        </div>
                    </div>
                </body>
                </html>
            `;
		}

		// Convert structure to treeified format
		const treeifiedStructure = treeify.asTree(structure, true, true);

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					body { 
						background: #252526; 
						color: #fff;
						font-family: -apple-system, BlinkMacSystemFont, sans-serif;
						margin: 0;
						padding: 0;
					}
					.container {
						display: flex;
						padding: 20px;
						gap: 20px;
					}
					.tree-section {
						flex: 1;
						position: relative;
					}
					.tree-container {
						position: relative;
					}
					.raw-structure {
						display: none;
					}
					.buttons-container {
						width: 200px;
						display: flex;
						flex-direction: column;
						gap: 10px;
					}
					.button {
						background: #0e639c;
						border: none;
						color: white;
						padding: 8px 16px;
						border-radius: 4px;
						cursor: pointer;
						font-size: 14px;
						transition: background-color 0.2s;
						display: flex;
						align-items: center;
						gap: 8px;
					}
					.button:hover {
						background: #1177bb;
					}
					.button:active {
						background: #0d5285;
					}
					.copy-button {
						position: absolute;
						top: 0px;
						right: 10px;
						background: rgba(14, 99, 156, 0.8);
						border: none;
						color: white;
						padding: 6px 12px;
						border-radius: 4px;
						cursor: pointer;
						display: flex;
						align-items: center;
						gap: 6px;
						font-size: 12px;
						transition: all 0.2s;
					}
					.copy-button:hover {
						background: rgba(17, 119, 187, 0.9);
					}
					.tooltip {
						position: absolute;
						background: #333;
						padding: 4px 8px;
						border-radius: 4px;
						font-size: 12px;
						top: 30px;
						left: 50%;
						transform: translateX(-50%);
						opacity: 0;
						transition: opacity 0.2s;
						pointer-events: none;
					}
					.copy-button.copied .tooltip {
						opacity: 1;
					}
				</style>
				<script>
					function downloadSVG() {
					const svg = document.querySelector('svg');
					if (!svg) {
						console.error('No SVG element found');
						return;
					}

					// Serialize the SVG element to a string
					const serializer = new XMLSerializer();
					const svgString = serializer.serializeToString(svg);

					// Create a Blob with the SVG content
					const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

					// Create a URL for the Blob
					const url = URL.createObjectURL(blob);

					// Create a temporary anchor element to trigger the download
					const a = document.createElement('a');
					a.href = url;
					a.download = 'folder-structure.svg'; // Set the filename for the download
					document.body.appendChild(a);

					// Trigger the download
					a.click();

					// Clean up
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				   }
	
					function copyToClipboard() {
						const treeStructure = document.querySelector('.raw-structure').textContent;
						navigator.clipboard.writeText(treeStructure).then(() => {
							const copyButton = document.querySelector('.copy-button');
							copyButton.classList.add('copied');
							setTimeout(() => {
								copyButton.classList.remove('copied');
							}, 2000);
						}).catch(err => {
							console.error('Failed to copy:', err);
						});
					}
				</script>
			</head>
			<body>
				<div class="container">
					<div class="tree-section">
						<div class="tree-container">
							${this._generateSvg(structure)}
						</div>
						<pre class="raw-structure">${treeifiedStructure}</pre>
						<button class="copy-button" onclick="copyToClipboard()">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
								<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
							</svg>
							Copy
							<span class="tooltip">Copied!</span>
						</button>
					</div>
					<div class="buttons-container">
						<button class="button">Apply Changes</button>
						<button class="button" onclick="downloadSVG()">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
								<polyline points="7 10 12 15 17 10"></polyline>
								<line x1="12" y1="15" x2="12" y2="3"></line>
							</svg>
							Download as SVG
						</button>
					</div>
				</div>
			</body>
			</html>
		`;
	}

	private _generateSvg(structure: any): string {
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

	private _processStructure(structure: any, prefix: string = '', result: string[] = [], level: number = 0): string[] {
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
		// Show initial loading state
		FolderStructurePanel.createOrShow(context, {
			loading: true,
			message: 'Reading folder structure...'
		});

		const structure = await getFolderStructure(folderUri);

		// Show intermediate loading state while waiting for Ollama
		FolderStructurePanel.createOrShow(context, {
			loading: true,
			message: 'Ghost is analyzing the structure...'
		});

		try {
			const treeifiedStructure = treeify.asTree(structure, true, true);
			const response = await sendToOllama(treeifiedStructure);

			if (response && typeof response === 'string') {
				const treeMatch = response.match(/<tree>([\s\S]*?)<\/tree>/);

				if (treeMatch && treeMatch[1]) {
					const parsedStructure = parseTreeToObject(treeMatch[1].trim());
					console.log("Ollama request recieved! \n", parsedStructure);
					FolderStructurePanel.createOrShow(context, parsedStructure);
				} else {
					// If we can't parse the Ollama response, show the original structure
					FolderStructurePanel.createOrShow(context, structure);
				}
			}
		} catch (ollamaError) {
			console.error('Error with Ollama request:', ollamaError);
			// Show original structure if Ollama fails
			FolderStructurePanel.createOrShow(context, structure);
		}
	} catch (error) {
		console.error('Error reading folder structure:', error);
		FolderStructurePanel.createOrShow(context, {
			loading: true,
			message: 'Error: Failed to read folder structure'
		});
		vscode.window.showErrorMessage('Failed to read folder structure. Check the console for details.');
	}
}

// Helper function to parse tree string back to object
function parseTreeToObject(treeStr: string): any {
	const lines = treeStr.split('\n');
	const root: any = {};
	let currentPath: string[] = [];
	let prevLevel = 0;

	lines.forEach(line => {
		if (!line.trim()) { return; }

		// Count the level based on indent markers
		const level = (line.match(/│/g) || []).length;
		const name = line.replace(/[│├└─\s]/g, '').replace(/\/$/, '');

		// Adjust the current path based on level
		if (level === prevLevel) {
			currentPath.pop();
		} else if (level < prevLevel) {
			currentPath = currentPath.slice(0, level);
		}

		// Add the current item
		if (name) {
			currentPath.push(name);
			let current = root;

			// Build the nested structure
			for (let i = 0; i < currentPath.length; i++) {
				const pathPart = currentPath[i];
				if (i === currentPath.length - 1) {
					current[pathPart] = line.endsWith('/') ? {} : null;
				} else {
					if (!current[pathPart]) {
						current[pathPart] = {};
					}
					current = current[pathPart];
				}
			}
		}

		prevLevel = level;
	});

	return root;
}

// Modified getFolderStructure to handle circular references
async function getFolderStructure(folderUri: vscode.Uri, visited = new Set<string>()): Promise<any> {
	const uriString = folderUri.toString();

	// Prevent circular references
	if (visited.has(uriString)) {
		return {};
	}
	visited.add(uriString);

	const files = await vscode.workspace.fs.readDirectory(folderUri);
	const structure: { [key: string]: any } = {};

	for (const [name, type] of files) {
		// Skip system files and hidden folders
		if (name.startsWith('.') || name === 'node_modules') {
			continue;
		}

		if (type === vscode.FileType.Directory) {
			structure[name] = await getFolderStructure(vscode.Uri.joinPath(folderUri, name), visited);
		} else {
			structure[name] = null;
		}
	}

	return structure;
}

// Updated sendToOllama function with better error handling
async function sendToOllama(structure: string): Promise<string> {
	try {
		console.log('Request sent to ollama!');
		const response = await axios.post('http://localhost:11434/api/generate', {
			model: 'llama3.1',
			prompt: `
					${structure}
					Analyze the provided react application folder structure above which is in a tree and return an improved version that follows best practices for project organization. Your response must:
                    1. Only contain the reorganized structure
                    2. Be wrapped in <tree> tags
                    3. Include no explanations or additional text or comments in or outside the <tree> tags
					Example output format: 
					<tree> 
					├── src/ │   
					├── components/ │   
							        └── utils/ 
							        └── tests/ 
					</tree> 
					`,
			stream: false
		});

		return response.data.response;
	} catch (error) {
		console.error('Error sending data to Ollama:', error);
		throw error;
	}

}