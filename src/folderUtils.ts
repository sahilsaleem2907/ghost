import * as vscode from 'vscode';

export interface FolderTree {
	[key: string]: FolderTree | null;
}

export interface FolderStructureResult {
	root: string;
	tree: FolderTree;
}

/**
 * Reads the directory at `folderUri` and returns its nested structure, descending
 * at most `maxDepth` levels. Files map to `null`, folders map to nested objects.
 * Hidden entries and `node_modules` are skipped.
 */
export async function getFolderStructure(folderUri: vscode.Uri, maxDepth: number, visited = new Set<string>()): Promise<FolderStructureResult> {
	const uriString = folderUri.toString();
	const root = folderUri.path.split('/').pop() || uriString;

	if (visited.has(uriString) || maxDepth <= 0) {
		return { root, tree: {} };
	}
	visited.add(uriString);

	const files = await vscode.workspace.fs.readDirectory(folderUri);
	const tree: FolderTree = {};

	for (const [name, type] of files) {
		if (name.startsWith('.') || name === 'node_modules') {
			continue;
		}

		if (type === vscode.FileType.Directory) {
			const child = await getFolderStructure(vscode.Uri.joinPath(folderUri, name), maxDepth - 1);
			tree[name] = child.tree;
		} else {
			tree[name] = null;
		}
	}

	return { root, tree };
}
