const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, BorderStyle, Table, TableRow, TableCell,
  WidthType, ShadingType, TabStopType, TabStopPosition
} = require('docx');

function parseMarkdownToDocx(mdContent, title) {
  const lines = mdContent.split('\n');
  const children = [];

  let inCodeBlock = false;
  let codeBlockLines = [];
  let inTable = false;
  let tableRows = [];

  function flushTable() {
    if (tableRows.length > 0) {
      try {
        // Filter out separator rows (---|---|---)
        const dataRows = tableRows.filter(row => !row.match(/^\|[\s\-:|]+\|$/));
        if (dataRows.length > 0) {
          const parsedRows = dataRows.map(row => {
            return row.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
          });
          
          if (parsedRows.length > 0 && parsedRows[0].length > 0) {
            const numCols = parsedRows[0].length;
            const colWidth = Math.floor(9000 / numCols);
            
            const tblRows = parsedRows.map((row, rowIndex) => {
              const cells = [];
              for (let i = 0; i < numCols; i++) {
                const cellText = row[i] || '';
                const isHeader = rowIndex === 0;
                cells.push(
                  new TableCell({
                    width: { size: colWidth, type: WidthType.DXA },
                    shading: isHeader ? { type: ShadingType.SOLID, color: '2563EB', fill: '2563EB' } : undefined,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cellText,
                            bold: isHeader,
                            color: isHeader ? 'FFFFFF' : '333333',
                            size: 20,
                            font: 'Segoe UI'
                          })
                        ],
                        spacing: { before: 40, after: 40 }
                      })
                    ]
                  })
                );
              }
              return new TableRow({ children: cells });
            });
            
            children.push(new Table({
              rows: tblRows,
              width: { size: 9000, type: WidthType.DXA }
            }));
            children.push(new Paragraph({ spacing: { after: 120 } }));
          }
        }
      } catch (e) {
        // If table parsing fails, just add as text
        tableRows.forEach(row => {
          children.push(new Paragraph({
            children: [new TextRun({ text: row, size: 20, font: 'Consolas' })],
            spacing: { after: 40 }
          }));
        });
      }
      tableRows = [];
    }
    inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/\r$/, '');

    // Code blocks
    if (line.match(/^```/)) {
      if (inCodeBlock) {
        // End code block
        const codeText = codeBlockLines.join('\n');
        children.push(new Paragraph({
          children: [new TextRun({
            text: codeText,
            font: 'Consolas',
            size: 18,
            color: '1E293B'
          })],
          shading: { type: ShadingType.SOLID, color: 'F1F5F9', fill: 'F1F5F9' },
          spacing: { before: 100, after: 100 },
          indent: { left: 400 }
        }));
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        if (inTable) flushTable();
        inCodeBlock = true;
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Table detection
    if (line.match(/^\|/)) {
      if (!inTable) inTable = true;
      tableRows.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Skip empty lines
    if (line.trim() === '') {
      children.push(new Paragraph({ spacing: { after: 60 } }));
      continue;
    }

    // Headings
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      children.push(new Paragraph({
        children: [new TextRun({
          text: line.replace(/^# /, '').replace(/[#*`]/g, ''),
          bold: true,
          size: 36,
          color: '1E40AF',
          font: 'Segoe UI'
        })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 150 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '3B82F6' } }
      }));
      continue;
    }

    if (line.startsWith('## ')) {
      children.push(new Paragraph({
        children: [new TextRun({
          text: line.replace(/^## /, '').replace(/[#*`]/g, ''),
          bold: true,
          size: 30,
          color: '1E3A8A',
          font: 'Segoe UI'
        })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 250, after: 120 }
      }));
      continue;
    }

    if (line.startsWith('### ')) {
      children.push(new Paragraph({
        children: [new TextRun({
          text: line.replace(/^### /, '').replace(/[#*`]/g, ''),
          bold: true,
          size: 26,
          color: '1E40AF',
          font: 'Segoe UI'
        })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 }
      }));
      continue;
    }

    if (line.startsWith('#### ')) {
      children.push(new Paragraph({
        children: [new TextRun({
          text: line.replace(/^#### /, '').replace(/[#*`]/g, ''),
          bold: true,
          size: 24,
          color: '374151',
          font: 'Segoe UI'
        })],
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 160, after: 80 }
      }));
      continue;
    }

    // Blockquote / Note
    if (line.startsWith('> ')) {
      children.push(new Paragraph({
        children: [new TextRun({
          text: line.replace(/^>\s*/, '').replace(/\*\*/g, ''),
          italics: true,
          size: 20,
          color: '6B7280',
          font: 'Segoe UI'
        })],
        indent: { left: 400 },
        spacing: { before: 60, after: 60 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: '3B82F6' } }
      }));
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'D1D5DB' } },
        spacing: { before: 120, after: 120 }
      }));
      continue;
    }

    // Bullet points
    if (line.match(/^[\s]*[-*]\s/)) {
      const indent = line.match(/^(\s*)/)[1].length;
      const text = line.replace(/^[\s]*[-*]\s/, '').replace(/\*\*/g, '').replace(/`([^`]+)`/g, '$1');
      children.push(new Paragraph({
        children: [
          new TextRun({ text: '• ', bold: true, color: '3B82F6', size: 20, font: 'Segoe UI' }),
          new TextRun({ text: text, size: 20, font: 'Segoe UI' })
        ],
        indent: { left: 400 + indent * 200 },
        spacing: { before: 40, after: 40 }
      }));
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const text = line.replace(/^\d+\.\s/, '').replace(/\*\*/g, '').replace(/`([^`]+)`/g, '$1');
      const num = line.match(/^(\d+)\./)[1];
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${num}. `, bold: true, color: '3B82F6', size: 20, font: 'Segoe UI' }),
          new TextRun({ text: text, size: 20, font: 'Segoe UI' })
        ],
        indent: { left: 400 },
        spacing: { before: 40, after: 40 }
      }));
      continue;
    }

    // Regular text - parse inline formatting
    const textRuns = [];
    // Simple parsing: handle **bold** and `code`
    let remaining = line;
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      const codeMatch = remaining.match(/`([^`]+)`/);
      
      let nextMatch = null;
      let matchType = null;
      
      if (boldMatch && (!codeMatch || boldMatch.index <= codeMatch.index)) {
        nextMatch = boldMatch;
        matchType = 'bold';
      } else if (codeMatch) {
        nextMatch = codeMatch;
        matchType = 'code';
      }
      
      if (nextMatch) {
        // Text before match
        if (nextMatch.index > 0) {
          textRuns.push(new TextRun({
            text: remaining.substring(0, nextMatch.index),
            size: 20,
            font: 'Segoe UI'
          }));
        }
        
        if (matchType === 'bold') {
          textRuns.push(new TextRun({
            text: nextMatch[1],
            bold: true,
            size: 20,
            font: 'Segoe UI'
          }));
        } else {
          textRuns.push(new TextRun({
            text: nextMatch[1],
            font: 'Consolas',
            size: 18,
            color: 'DC2626',
            shading: { type: ShadingType.SOLID, color: 'FEF2F2', fill: 'FEF2F2' }
          }));
        }
        
        remaining = remaining.substring(nextMatch.index + nextMatch[0].length);
      } else {
        textRuns.push(new TextRun({
          text: remaining,
          size: 20,
          font: 'Segoe UI'
        }));
        remaining = '';
      }
    }

    children.push(new Paragraph({
      children: textRuns,
      spacing: { before: 40, after: 40 }
    }));
  }

  // Flush remaining table
  if (inTable) flushTable();

  return new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1200, bottom: 1440, left: 1200 }
        }
      },
      children: children
    }]
  });
}

async function convert(inputFile, outputFile) {
  const mdContent = fs.readFileSync(inputFile, 'utf-8');
  const title = path.basename(inputFile, '.md');
  const doc = parseMarkdownToDocx(mdContent, title);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputFile, buffer);
  console.log(`✅ Created: ${outputFile}`);
}

async function main() {
  const dir = __dirname;
  
  try {
    await convert(
      path.join(dir, '01_TongQuan_KienTruc_DuAn.md'),
      path.join(dir, '01_TongQuan_KienTruc_DuAn.docx')
    );
  } catch (e) {
    console.log("⚠️ Bỏ qua 01_TongQuan_KienTruc_DuAn.docx vì đang được mở/bị khóa.");
  }
  
  try {
    await convert(
      path.join(dir, '02_ChucNang_API_ChiTiet.md'),
      path.join(dir, '02_ChucNang_API_ChiTiet.docx')
    );
  } catch (e) {
    console.log("⚠️ Lỗi khi tạo 02_ChucNang_API_ChiTiet.docx:", e.message);
  }
  
  console.log('\n🎉 Hoàn tất!');
}

main().catch(console.error);
