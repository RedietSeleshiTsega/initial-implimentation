"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    console.log("=== METTA EXTENSION ACTIVATING ===");
    // Path to the compiled server
    const serverModule = context.asAbsolutePath(path.join("out", "server", "server.js"));
    console.log("Server module path:", serverModule);
    // Server options
    const serverOptions = {
        run: {
            module: serverModule,
            transport: node_1.TransportKind.stdio
        },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.stdio,
            options: { execArgv: ["--nolazy", "--inspect=6009"] }
        }
    };
    // Client options
    const clientOptions = {
        documentSelector: [{ scheme: "file", language: "metta" }],
        synchronize: {
            fileEvents: vscode_1.workspace.createFileSystemWatcher("**/*.metta")
        }
    };
    // Create and start the client
    client = new node_1.LanguageClient("mettaLanguageServer", "Metta Language Server", serverOptions, clientOptions);
    console.log("Starting language client...");
    client.start();
    console.log("=== METTA EXTENSION ACTIVATED ===");
}
function deactivate() {
    console.log("=== METTA EXTENSION DEACTIVATING ===");
    if (!client) {
        return undefined;
    }
    return client.stop();
}
