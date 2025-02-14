import * as vscode from 'vscode';
import * as treeify from 'treeify';

export function activate(context: vscode.ExtensionContext) {
	// Register the command to show the folder structure
	const disposable = vscode.commands.registerCommand('ghost.spook', () => {
		if (vscode.workspace.workspaceFolders) {
			const workspaceFolder = vscode.workspace.workspaceFolders[0]; // Get the first workspace folder
			console.log('Workspace folder:', workspaceFolder.uri.fsPath);

			// Display the folder structure
			displayFolderStructure(workspaceFolder.uri);
		} else {
			vscode.window.showErrorMessage('No workspace folder is opened.');
		}
	});

	// Add the command to the extension's subscriptions
	context.subscriptions.push(disposable);
}

async function getFolderStructure(folderUri: vscode.Uri): Promise<any> {
	const files = await vscode.workspace.fs.readDirectory(folderUri);
	const structure: { [key: string]: any } = {};

	for (const [name, type] of files) {
		if (type === vscode.FileType.Directory) {
			// Recursively get the structure of subdirectories
			structure[name] = await getFolderStructure(vscode.Uri.joinPath(folderUri, name));
		} else {
			// Files have no children
			structure[name] = null;
		}
	}

	return structure;
}

async function displayFolderStructure(folderUri: vscode.Uri) {
	try {
		const structure = await getFolderStructure(folderUri);
		console.log(treeify.asTree(structure, true, false));
	} catch (error) {
		console.error('Error reading folder structure:', error);
		vscode.window.showErrorMessage('Failed to read folder structure. Check the console for details.');
	}
}