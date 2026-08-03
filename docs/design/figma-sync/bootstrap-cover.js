/**
 * NestMate Premium — Figma bootstrap (run via use_figma AFTER desktop MCP auth)
 * Creates: Cover, Principles, IA, Wireframes page skeleton, Hi-fi page skeleton
 * skillNames: figma-use,figma-generate-library
 *
 * Paste into use_figma after create_new_file. Colors 0–1. Return all node IDs.
 */
async function bootstrap() {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  const page = figma.currentPage;
  page.name = 'Cover';

  const cover = figma.createAutoLayout('VERTICAL', {
    name: 'Cover / NestMate Premium',
    itemSpacing: 16,
    paddingTop: 80,
    paddingBottom: 80,
    paddingLeft: 80,
    paddingRight: 80,
  });
  cover.primaryAxisSizingMode = 'AUTO';
  cover.counterAxisSizingMode = 'AUTO';
  cover.fills = [{ type: 'SOLID', color: { r: 0.969, g: 0.953, b: 0.929 } }];
  cover.x = 100;
  cover.y = 100;

  const t1 = figma.createText();
  t1.characters = 'NestMate Premium';
  t1.fontSize = 48;
  t1.fontName = { family: 'Inter', style: 'Bold' };
  t1.fills = [{ type: 'SOLID', color: { r: 0.102, g: 0.102, b: 0.18 } }];

  const t2 = figma.createText();
  t2.characters = 'Research → Principles → IA → Lo-fi → Hi-fi\nHTML sources of truth live in docs/design until synced.';
  t2.fontSize = 16;
  t2.fontName = { family: 'Inter', style: 'Regular' };
  t2.fills = [{ type: 'SOLID', color: { r: 0.102, g: 0.102, b: 0.18 } }];
  t2.opacity = 0.7;

  cover.appendChild(t1);
  cover.appendChild(t2);
  page.appendChild(cover);

  const pages = ['01 Principles', '02 IA', '03 Wireframes 390', '04 Hi-fi Mobile', '05 Prototype'];
  const created = [{ id: cover.id, name: cover.name, page: 'Cover' }];
  for (const name of pages) {
    const p = figma.createPage();
    p.name = name;
    created.push({ id: p.id, name });
  }

  return {
    createdNodeIds: created.map((c) => c.id),
    pages: created,
    next: 'Import wireframe frames from docs/design/wireframes; bind tokens from 03-DESIGN_PRINCIPLES.md',
  };
}

return await bootstrap();
