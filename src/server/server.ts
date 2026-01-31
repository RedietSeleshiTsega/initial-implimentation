import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  Hover,
  InitializeParams,
  TextDocumentSyncKind,
  Location,
  ReferenceParams
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

const connection = createConnection();
const documents = new TextDocuments(TextDocument);

connection.onInitialize((_params: InitializeParams) => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true,
      referencesProvider: true
    }
  };
});

documents.onDidChangeContent(change => {
  try {
    const text = change.document.getText();
    const diagnostics: Diagnostic[] = [];

    let balance = 0;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === "(") balance++;
      if (text[i] === ")") balance--;

      if (balance < 0) {
        try {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: change.document.positionAt(i),
              end: change.document.positionAt(i + 1)
            },
            message: "Unmatched closing parenthesis"
          });
        } catch (error) {
          // If positionAt fails, skip this diagnostic
          connection.console.error(`Error creating diagnostic at position ${i}: ${error}`);
        }
        break;
      }
    }

    if (balance > 0) {
      try {
        const lastPos = Math.max(0, text.length - 1);
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: change.document.positionAt(lastPos),
            end: change.document.positionAt(text.length)
          },
          message: "Missing closing parenthesis"
        });
      } catch (error) {
        // If positionAt fails, skip this diagnostic
        connection.console.error(`Error creating diagnostic at end: ${error}`);
      }
    }

    connection.sendDiagnostics({
      uri: change.document.uri,
      diagnostics
    });
  } catch (error) {
    connection.console.error(`Error processing document change: ${error}`);
  }
});

connection.onHover((params): Hover | null => {
  try {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }
    return {
      contents: {
        kind: "markdown",
        value: "**Metta Symbol**\n\nThis is a placeholder hover."
      }
    };
  } catch (error) {
    connection.console.error(`Error handling hover: ${error}`);
    return null;
  }
});

// Helper function to extract the word/symbol at a given position
function getWordAtPosition(document: TextDocument, position: { line: number; character: number }): string | null {
  try {
    const text = document.getText();
    const offset = document.offsetAt(position);
    
    // Metta identifier pattern: alphanumeric, underscore, dash, and some special chars
    // Word boundaries for Metta: whitespace, parentheses, brackets, quotes
    const wordPattern = /[a-zA-Z0-9_\-$%&*+./:<=>?@^|~]+/g;
    let match;
    
    while ((match = wordPattern.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
      if (offset >= start && offset <= end) {
        return match[0];
      }
    }
    
    return null;
  } catch (error) {
    connection.console.error(`Error extracting word at position: ${error}`);
    return null;
  }
}

// Helper function to find all occurrences of a word in a document
function findWordOccurrences(document: TextDocument, word: string): Location[] {
  const locations: Location[] = [];
  try {
    const text = document.getText();
    // Use word boundaries to match exact word (not substring)
    // Escape special regex characters in the word
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match word with word boundaries (whitespace, parentheses, brackets, etc.)
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'g');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const start = document.positionAt(match.index);
      const end = document.positionAt(match.index + match[0].length);
      
      locations.push({
        uri: document.uri,
        range: {
          start,
          end
        }
      });
    }
  } catch (error) {
    connection.console.error(`Error finding word occurrences: ${error}`);
  }
  
  return locations;
}

connection.onReferences((params: ReferenceParams): Location[] | null => {
  try {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }
    
    // Extract the word at the cursor position
    const word = getWordAtPosition(document, params.position);
    if (!word) {
      return [];
    }
    
    const locations: Location[] = [];
    
    // If includeDeclaration is true, we should include the definition location
    // For now, we'll search in all documents (or just current document)
    // For a simple implementation, search only in the current document
    // For workspace-wide search, iterate through all documents
    
    if (params.context.includeDeclaration) {
      // Find all occurrences in the current document
      const currentDocLocations = findWordOccurrences(document, word);
      locations.push(...currentDocLocations);
    } else {
      // Find all references (excluding the declaration)
      // For now, we'll include all occurrences
      const currentDocLocations = findWordOccurrences(document, word);
      locations.push(...currentDocLocations);
    }
    
    // Optionally search in all open documents for workspace-wide references
    // Uncomment the following to enable workspace-wide search:
    /*
    for (const doc of documents.all()) {
      if (doc.uri !== document.uri) {
        const docLocations = findWordOccurrences(doc, word);
        locations.push(...docLocations);
      }
    }
    */
    
    return locations;
  } catch (error) {
    connection.console.error(`Error handling references: ${error}`);
    return [];
  }
});

connection.onDidChangeConfiguration(() => {
  connection.console.log("Configuration changed");
});

// Set up document tracking
documents.listen(connection);

// Start the server
connection.listen();

// Handle uncaught errors to prevent crashes
process.on("uncaughtException", (error) => {
  connection.console.error(`Uncaught exception: ${error.message}`);
});

process.on("unhandledRejection", (reason, promise) => {
  connection.console.error(`Unhandled rejection: ${reason}`);
});
