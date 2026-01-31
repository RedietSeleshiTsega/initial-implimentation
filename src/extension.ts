import * as vscode from "vscode";
import * as path from "path";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join("out", "server", "server.js")
  );

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.stdio },
    debug: { module: serverModule, transport: TransportKind.stdio }
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "metta" }]
  };

  client = new LanguageClient(
    "mettaLS",
    "Metta Language Server",
    serverOptions,
    clientOptions
  );

  client.start();
}

export function deactivate() {
  return client?.stop();
}
