import path from 'path';
import { CrossReference } from '../types/index.js';

export class CrossReferenceAnalyzer {
  
  static analyzeFileReferences(filePath: string, content: string, allFiles: string[]): CrossReference[] {
    const references: CrossReference[] = [];
    const ext = path.extname(filePath).toLowerCase();
    
    // Analyze based on file type
    switch (ext) {
      case '.ts':
      case '.js':
      case '.tsx':
      case '.jsx':
        references.push(...this.analyzeJavaScriptTypeScript(content, filePath, allFiles));
        break;
      case '.py':
        references.push(...this.analyzePython(content, filePath, allFiles));
        break;
      case '.java':
        references.push(...this.analyzeJava(content, filePath, allFiles));
        break;
      case '.go':
        references.push(...this.analyzeGo(content, filePath, allFiles));
        break;
      case '.rs':
        references.push(...this.analyzeRust(content, filePath, allFiles));
        break;
      case '.cpp':
      case '.c':
      case '.h':
      case '.hpp':
        references.push(...this.analyzeCpp(content, filePath, allFiles));
        break;
      default:
        references.push(...this.analyzeGeneric(content, filePath, allFiles));
    }
    
    return this.deduplicateReferences(references);
  }

  private static analyzeJavaScriptTypeScript(content: string, filePath: string, allFiles: string[]): CrossReference[] {
    const references: CrossReference[] = [];
    
    // Import statements
    const importRegex = /import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]+\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const resolvedPath = this.resolveImportPath(importPath, filePath, allFiles);
      if (resolvedPath) {
        references.push({
          type: 'imports',
          target: resolvedPath,
          description: `imports from ${importPath}`,
        });
      }
    }

    // Export statements
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      references.push({
        type: 'exports',
        target: match[1],
        description: `exports ${match[1]}`,
      });
    }

    // Class extensions
    const extendsRegex = /class\s+\w+\s+extends\s+(\w+)/g;
    while ((match = extendsRegex.exec(content)) !== null) {
      references.push({
        type: 'extends',
        target: match[1],
        description: `extends ${match[1]}`,
      });
    }

    // Interface implementations
    const implementsRegex = /class\s+\w+.*?implements\s+([^{]+)/g;
    while ((match = implementsRegex.exec(content)) !== null) {
      const interfaces = match[1].split(',').map(i => i.trim());
      interfaces.forEach(iface => {
        references.push({
          type: 'implements',
          target: iface,
          description: `implements ${iface}`,
        });
      });
    }

    return references;
  }

  private static analyzePython(content: string, filePath: string, allFiles: string[]): CrossReference[] {
    const references: CrossReference[] = [];
    
    // Import statements
    const importRegex = /^(?:from\s+([^\s]+)\s+)?import\s+([^\n#]+)/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const module = match[1] || match[2].split(',')[0].trim();
      const resolvedPath = this.resolveImportPath(module, filePath, allFiles);
      if (resolvedPath) {
        references.push({
          type: 'imports',
          target: resolvedPath,
          description: `imports ${module}`,
        });
      }
    }

    // Class inheritance
    const classRegex = /class\s+(\w+)\s*\(([^)]+)\)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const baseClasses = match[2].split(',').map(c => c.trim());
      baseClasses.forEach(baseClass => {
        if (baseClass !== 'object') {
          references.push({
            type: 'extends',
            target: baseClass,
            description: `inherits from ${baseClass}`,
          });
        }
      });
    }

    return references;
  }

  private static analyzeJava(content: string, _filePath: string, _allFiles: string[]): CrossReference[] {
    const references: CrossReference[] = [];
    
    // Import statements
    const importRegex = /import\s+(?:static\s+)?([^;\n]+);/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      references.push({
        type: 'imports',
        target: importPath,
        description: `imports ${importPath}`,
      });
    }

    // Class extensions
    const extendsRegex = /class\s+\w+\s+extends\s+(\w+)/g;
    while ((match = extendsRegex.exec(content)) !== null) {
      references.push({
        type: 'extends',
        target: match[1],
        description: `extends ${match[1]}`,
      });
    }

    // Interface implementations
    const implementsRegex = /(?:class|enum)\s+\w+.*?implements\s+([^{]+)/g;
    while ((match = implementsRegex.exec(content)) !== null) {
      const interfaces = match[1].split(',').map(i => i.trim());
      interfaces.forEach(iface => {
        references.push({
          type: 'implements',
          target: iface,
          description: `implements ${iface}`,
        });
      });
    }

    return references;
  }

  private static analyzeGo(content: string, _filePath: string, _allFiles: string[]): CrossReference[] {
    const references: CrossReference[] = [];
    
    // Import statements
    const importRegex = /import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const imports = match[1] || match[2];
      if (match[1]) {
        // Multi-line imports
        const lines = imports.split('\n');
        lines.forEach(line => {
          const importMatch = line.match(/"([^"]+)"/);
          if (importMatch) {
            references.push({
              type: 'imports',
              target: importMatch[1],
              description: `imports ${importMatch[1]}`,
            });
          }
        });
      } else {
        references.push({
          type: 'imports',
          target: imports,
          description: `imports ${imports}`,
        });
      }
    }

    // Struct embedding
    const embedRegex = /type\s+\w+\s+struct\s*\{[^}]*?(\w+)(?:\s*\/\/.*?)?\s*\}/g;
    while ((match = embedRegex.exec(content)) !== null) {
      if (!match[1].includes(' ')) { // Embedded type (no field name)
        references.push({
          type: 'extends',
          target: match[1],
          description: `embeds ${match[1]}`,
        });
      }
    }

    return references;
  }

  private static analyzeRust(content: string, _filePath: string, _allFiles: string[]): CrossReference[] {
    const references: CrossReference[] = [];
    
    // Use statements
    const useRegex = /use\s+([^;\n]+);/g;
    let match;
    while ((match = useRegex.exec(content)) !== null) {
      references.push({
        type: 'imports',
        target: match[1],
        description: `uses ${match[1]}`,
      });
    }

    // Trait implementations
    const implRegex = /impl\s+(?:<[^>]*>\s+)?(\w+)\s+for\s+(\w+)/g;
    while ((match = implRegex.exec(content)) !== null) {
      references.push({
        type: 'implements',
        target: match[1],
        description: `implements ${match[1]} for ${match[2]}`,
      });
    }

    return references;
  }

  private static analyzeCpp(content: string, filePath: string, allFiles: string[]): CrossReference[] {
    const references: CrossReference[] = [];
    
    // Include statements
    const includeRegex = /#include\s+[<"]([^>"]+)[>"]/g;
    let match;
    while ((match = includeRegex.exec(content)) !== null) {
      const includePath = match[1];
      const resolvedPath = this.resolveImportPath(includePath, filePath, allFiles);
      if (resolvedPath) {
        references.push({
          type: 'imports',
          target: resolvedPath,
          description: `includes ${includePath}`,
        });
      }
    }

    // Class inheritance
    const inheritanceRegex = /class\s+\w+\s*:\s*(?:public|private|protected\s+)?([^{]+)/g;
    while ((match = inheritanceRegex.exec(content)) !== null) {
      const baseClasses = match[1].split(',').map(c => c.trim().replace(/^(public|private|protected)\s+/, ''));
      baseClasses.forEach(baseClass => {
        references.push({
          type: 'extends',
          target: baseClass,
          description: `inherits from ${baseClass}`,
        });
      });
    }

    return references;
  }

  private static analyzeGeneric(content: string, filePath: string, allFiles: string[]): CrossReference[] {
    const references: CrossReference[] = [];
    
    // Look for file references in comments or strings
    const fileRefRegex = /(?:\.\/|\.\.\/|\/)?[\w\-./]+\.(ts|js|py|java|go|rs|cpp|c|h|hpp|jsx|tsx)/g;
    let match;
    while ((match = fileRefRegex.exec(content)) !== null) {
      const referencedFile = match[0];
      const resolvedPath = this.resolveImportPath(referencedFile, filePath, allFiles);
      if (resolvedPath && resolvedPath !== filePath) {
        references.push({
          type: 'uses',
          target: resolvedPath,
          description: `references ${referencedFile}`,
        });
      }
    }

    return references;
  }

  private static resolveImportPath(importPath: string, currentFile: string, allFiles: string[]): string | null {
    const currentDir = path.dirname(currentFile);
    
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const resolved = path.resolve(currentDir, importPath);
      
      // Try with common extensions
      const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.h'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (allFiles.includes(withExt)) {
          return withExt;
        }
      }
      
      // Try index files
      for (const ext of extensions) {
        const indexFile = path.join(resolved, `index${  ext}`);
        if (allFiles.includes(indexFile)) {
          return indexFile;
        }
      }
    }
    
    // For absolute imports, try to find matching files
    const fileName = path.basename(importPath);
    const matchingFiles = allFiles.filter(file => {
      const baseName = path.basename(file, path.extname(file));
      return baseName === fileName || file.includes(importPath);
    });
    
    return matchingFiles.length === 1 ? matchingFiles[0] : null;
  }

  private static deduplicateReferences(references: CrossReference[]): CrossReference[] {
    const seen = new Set<string>();
    return references.filter(ref => {
      const key = `${ref.type}:${ref.target}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}