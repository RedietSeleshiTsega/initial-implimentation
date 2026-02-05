# Metta Language Server for VS Code

A language server implementation for the Metta language (Hyperon MeTTa) providing intelligent code editing features in Visual Studio Code.

## Features

✅ **Syntax Error Detection** - Real-time parenthesis balance checking
✅ **Hover Information** - See symbol usage counts
✅ **Find All References** - Locate all uses of a symbol across files  
✅ **Auto-Formatting** - Clean up code with proper S-expression indentation

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Compile
```bash
npm run compile
```

### 3. Test in VS Code
1. Press `F5` to launch Extension Development Host
2. Open or create a `.metta` file
3. Try the features!

## Project Structure

```
metta-language-server/
├── src/
│   ├── extension.ts       # Extension entry point
│   └── server/
│       └── server.ts      # Language server implementation
├── out/                   # Compiled JavaScript (auto-generated)
├── .vscode/              # VS Code configuration
│   ├── launch.json       # Debug settings
│   └── tasks.json        # Build tasks
├── package.json          # Extension metadata
└── tsconfig.json         # TypeScript config
```

## Usage Examples

### Parenthesis Checking
```metta
(define test (x)
  (+ x 1)    ; ← Error: Missing closing paren
```

### Hover Info
Hover over any symbol to see how many times it's used.

### Find References
Right-click any symbol → "Find All References"

### Format Document
Right-click → "Format Document" or press:
- Windows/Linux: `Shift+Alt+F`
- Mac: `Shift+Option+F`

Before:
```metta
(define factorial (n) (if (= n 0) 1 (* n (factorial (- n 1)))))
```

After:
```metta
(define factorial
  (n)
  (if
    (= n 0)
    1
    (* n
      (factorial
        (- n 1)))))
```

## Development

### Watch Mode
Auto-compile on file changes:
```bash
npm run watch
```

### Debugging
1. Set breakpoints in `src/` files
2. Press `F5`
3. Use Debug Console to view logs

### Viewing Server Logs
In Extension Development Host:
- `View` → `Output` → Select "Metta Language Server"

## Troubleshooting

**Features not working?** See `SETUP_GUIDE.md` for detailed troubleshooting.

**Common fixes:**
```bash
# Reinstall dependencies
npm install

# Recompile
npm run compile

# Verify output
ls out/server/server.js
```

**Still having issues?** Check that:
- File has `.metta` extension
- `out/server/server.js` exists
- No TypeScript errors during compilation

## Files Included

- `SETUP_GUIDE.md` - Detailed setup and troubleshooting
- `GUIDE.md` - Learn how the language server works
- `RUST_IMPLEMENTATION.md` - Future Rust version

## Requirements

- Node.js 14 or higher
- VS Code 1.80 or higher
- TypeScript 5.3 or higher

## License

This project is for the Hyperon MeTTa language.

## Contributing

To add new features:
1. Edit `src/server/server.ts`
2. Run `npm run compile`
3. Press `Ctrl+R` in Extension Development Host to reload

## Learn More

- Metta Language: https://github.com/trueagi-io/hyperon-experimental
- VS Code Extensions: https://code.visualstudio.com/api
- Language Server Protocol: https://microsoft.github.io/language-server-protocol/