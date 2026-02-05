import * as path from "path";
import { workspace, ExtensionContext } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  console.log("=== METTA EXTENSION ACTIVATING ===");

  // Path to the compiled server
  const serverModule = context.asAbsolutePath(
    path.join("out", "server", "server.js")
  );

  console.log("Server module path:", serverModule);

  // Server options
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.stdio
    },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
      options: { execArgv: ["--nolazy", "--inspect=6009"] }
    }
  };

  // Client options
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "metta" }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher("**/*.metta")
    }
  };

  // Create and start the client
  client = new LanguageClient(
    "mettaLanguageServer",
    "Metta Language Server",
    serverOptions,
    clientOptions
  );

  console.log("Starting language client...");
  client.start();
  console.log("=== METTA EXTENSION ACTIVATED ===");
}

export function deactivate(): Thenable<void> | undefined {
  console.log("=== METTA EXTENSION DEACTIVATING ===");
  if (!client) {
    return undefined;
  }
  return client.stop();
}