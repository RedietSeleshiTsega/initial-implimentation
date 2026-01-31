"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const path = require("path");
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    const serverModule = context.asAbsolutePath(path.join("out", "server", "server.js"));
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.stdio },
        debug: { module: serverModule, transport: node_1.TransportKind.stdio }
    };
    const clientOptions = {
        documentSelector: [{ scheme: "file", language: "metta" }]
    };
    client = new node_1.LanguageClient("mettaLS", "Metta Language Server", serverOptions, clientOptions);
    client.start();
}
function deactivate() {
    return client?.stop();
}
