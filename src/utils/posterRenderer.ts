import path from 'path';
import fs from 'fs';
import { createCanvas, registerFont, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';

// Registration flag to prevent multiple font registrations
let isFontRegistered = false;

export const ensureFontsRegistered = (): void => {
  if (isFontRegistered) return;

  try {
    const fontPath = path.resolve(__dirname, '../assets/fonts/Kalpurush.ttf');
    if (fs.existsSync(fontPath)) {
      registerFont(fontPath, { family: 'Kalpurush' });
      console.log('✅ Registered Kalpurush font from:', fontPath);
    } else {
      console.warn('⚠️ Kalpurush.ttf not found at:', fontPath);
    }

    // Optional fallback to Windows Nirmala UI if present
    const nirmalaPath = 'C:/Windows/Fonts/Nirmala.ttf';
    if (fs.existsSync(nirmalaPath)) {
      try {
        registerFont(nirmalaPath, { family: 'Nirmala' });
        console.log('✅ Registered Nirmala fallback font');
      } catch (err) {
        // Ignore if already registered
      }
    }

    isFontRegistered = true;
  } catch (error) {
    console.error('❌ Error registering font:', error);
  }
};

export interface PosterTheme {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  bannerText?: string;
  headline?: string;
  secondarySlogan?: string;
  badgeText?: string;
}

export interface RenderPosterOptions {
  template?: {
    occasionType?: string;
    layoutConfig?: {
      width?: number;
      height?: number;
      palette?: string[];
      background?: {
        color?: string;
        gradient?: string;
      };
      [key: string]: any;
    };
  };
  formData: {
    candidateName?: string;
    designation?: string;
    partyName?: string;
    slogan?: string;
    secondarySlogan?: string;
    occasion?: string;
    eventDate?: string;
    venue?: string;
    greetingText?: string;
    symbolName?: string;
    footerCredit?: string;
    [key: string]: any;
  };
  photos?: {
    candidatePhoto?: string | Buffer;
    leaderPhotos?: Array<string | Buffer>;
    symbolPhoto?: string | Buffer;
  };
  dynamicTheme?: PosterTheme;
}

/**
 * Utility to wrap text neatly on canvas
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Draw image fitted inside a circular frame
 */
async function drawCircularImage(
  ctx: CanvasRenderingContext2D,
  imageSource: string | Buffer | undefined,
  centerX: number,
  centerY: number,
  radius: number,
  borderColor = '#FFFFFF',
  borderWidth = 6,
  fallbackText?: string
): Promise<void> {
  ctx.save();

  // Draw shadow for frame
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  // Outer ring border
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + borderWidth / 2, 0, Math.PI * 2);
  ctx.fillStyle = borderColor;
  ctx.fill();

  ctx.restore();

  // Reset shadow for inner clipping
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  let loaded = false;
  if (imageSource) {
    try {
      const img = await loadImage(imageSource as any);
      // Calculate aspect cover dimensions
      const aspect = img.width / img.height;
      const size = radius * 2;
      let drawW = size;
      let drawH = size;
      let offsetX = centerX - radius;
      let offsetY = centerY - radius;

      if (aspect > 1) {
        drawW = size * aspect;
        offsetX = centerX - drawW / 2;
      } else {
        drawH = size / aspect;
        offsetY = centerY - drawH / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      loaded = true;
    } catch (err) {
      console.warn('⚠️ Could not load image source, drawing fallback placeholder:', err);
    }
  }

  if (!loaded) {
    // Elegant fallback avatar
    const grad = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
    grad.addColorStop(0, '#374151');
    grad.addColorStop(1, '#1F2937');
    ctx.fillStyle = grad;
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

    ctx.fillStyle = '#E5E7EB';
    ctx.font = `bold ${Math.round(radius * 0.4)}px Kalpurush, Nirmala, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallbackText ? fallbackText.slice(0, 4) : 'ছবি', centerX, centerY);
  }

  ctx.restore();

  // Draw crisp ring overlay
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();
}

/**
 * Main Poster Renderer
 */
export async function renderPoster(options: RenderPosterOptions): Promise<Buffer> {
  ensureFontsRegistered();

  const { template, formData, photos, dynamicTheme } = options;

  const width = template?.layoutConfig?.width || 1200;
  const height = template?.layoutConfig?.height || 1600;

  const canvas: Canvas = createCanvas(width, height);
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

  // Palette resolution
  const primaryColor = dynamicTheme?.primaryColor || template?.layoutConfig?.palette?.[0] || '#006A4E';
  const secondaryColor = dynamicTheme?.secondaryColor || template?.layoutConfig?.palette?.[1] || '#B71C1C';
  const accentColor = dynamicTheme?.accentColor || template?.layoutConfig?.palette?.[2] || '#FFD700';
  const backgroundColor = dynamicTheme?.backgroundColor || '#0B1320';
  const textColor = dynamicTheme?.textColor || '#FFFFFF';

  // 1. Background Rendering
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, primaryColor);
  bgGrad.addColorStop(0.55, backgroundColor);
  bgGrad.addColorStop(1, '#050B14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Decorative soft radial spotlight in center
  const radial = ctx.createRadialGradient(width / 2, height * 0.45, 80, width / 2, height * 0.45, 600);
  radial.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  radial.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
  radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, width, height);

  // Top header geometric wave/polygon accent
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, 220);
  ctx.bezierCurveTo(width * 0.75, 260, width * 0.25, 180, 0, 240);
  ctx.closePath();
  const topGrad = ctx.createLinearGradient(0, 0, width, 0);
  topGrad.addColorStop(0, secondaryColor);
  topGrad.addColorStop(1, primaryColor);
  ctx.fillStyle = topGrad;
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.restore();

  // 2. Poster Borders & Inset Frame
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Corner floral/geometric brackets
  const cornerSize = 40;
  const corners = [
    [42, 42, 1, 1],
    [width - 42, 42, -1, 1],
    [42, height - 42, 1, -1],
    [width - 42, height - 42, -1, -1],
  ];
  ctx.fillStyle = accentColor;
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dx * cornerSize, cy);
    ctx.lineTo(cx, cy + dy * cornerSize);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 3. Top Invocation / Religious or Patriotic Header
  const headerBannerText =
    dynamicTheme?.bannerText ||
    formData.greetingText ||
    'বিসমিল্লাহির রাহমানির রাহীম';

  ctx.save();
  ctx.font = 'bold 26px Kalpurush, Nirmala, sans-serif';
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 6;
  ctx.fillText(headerBannerText, width / 2, 70);
  ctx.restore();

  // 4. Senior Leader Photos (Placed at top-left and top-right)
  const leaderPhotos = photos?.leaderPhotos || [];
  const leaderRadius = 70;

  // Left Leader Slot
  if (leaderPhotos.length > 0) {
    await drawCircularImage(
      ctx,
      leaderPhotos[0],
      140,
      175,
      leaderRadius,
      accentColor,
      5,
      'নেতা ১'
    );
  } else {
    await drawCircularImage(
      ctx,
      undefined,
      140,
      175,
      leaderRadius,
      accentColor,
      5,
      'নেতা ১'
    );
  }

  // Right Leader Slot
  if (leaderPhotos.length > 1) {
    await drawCircularImage(
      ctx,
      leaderPhotos[1],
      width - 140,
      175,
      leaderRadius,
      accentColor,
      5,
      'নেতা ২'
    );
  } else {
    await drawCircularImage(
      ctx,
      undefined,
      width - 140,
      175,
      leaderRadius,
      accentColor,
      5,
      'নেতা ২'
    );
  }

  // Center Party / Occasion Badge
  const partyOrOccasion = formData.partyName || formData.occasion || 'বাংলাদেশ';
  ctx.save();
  const badgeWidth = 420;
  const badgeHeight = 52;
  const badgeX = (width - badgeWidth) / 2;
  const badgeY = 125;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 26);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 26px Kalpurush, Nirmala, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(partyOrOccasion, width / 2, badgeY + 35);
  ctx.restore();

  // 5. Main Headline / Slogan Banner
  const mainHeadline =
    formData.slogan ||
    dynamicTheme?.headline ||
    'আসন্ন নির্বাচনে আপনার মূল্যবান ভোট দিন';

  ctx.save();
  ctx.font = 'bold 54px Kalpurush, Nirmala, sans-serif';
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;

  const headlineLines = wrapText(ctx, mainHeadline, width - 260);
  let headlineY = 275;
  for (const line of headlineLines) {
    ctx.fillText(line, width / 2, headlineY);
    headlineY += 68;
  }
  ctx.restore();

  // Secondary Slogan / Sub-headline
  const subSlogan =
    formData.secondarySlogan ||
    dynamicTheme?.secondarySlogan ||
    formData.occasion ||
    'ন্যায়, উন্নয়ন ও শান্তির পক্ষে ঐক্যবদ্ধ হোন';

  if (subSlogan) {
    ctx.save();
    ctx.font = '32px Kalpurush, Nirmala, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 8;
    const subLines = wrapText(ctx, subSlogan, width - 280);
    for (const sLine of subLines) {
      ctx.fillText(sLine, width / 2, headlineY + 10);
      headlineY += 46;
    }
    ctx.restore();
  }

  // 6. Candidate Main Portrait (Large Central / Lower Center Frame)
  const candidateRadius = 210;
  const candidateCenterY = Math.max(headlineY + candidateRadius + 20, 680);
  const candidateCenterX = width / 2;

  // Halo / Glow behind candidate
  ctx.save();
  const candidateGlow = ctx.createRadialGradient(
    candidateCenterX,
    candidateCenterY,
    candidateRadius * 0.7,
    candidateCenterX,
    candidateCenterY,
    candidateRadius * 1.5
  );
  candidateGlow.addColorStop(0, `${accentColor}55`);
  candidateGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = candidateGlow;
  ctx.fillRect(
    candidateCenterX - candidateRadius * 1.5,
    candidateCenterY - candidateRadius * 1.5,
    candidateRadius * 3,
    candidateRadius * 3
  );
  ctx.restore();

  // Draw Candidate Photo
  await drawCircularImage(
    ctx,
    photos?.candidatePhoto,
    candidateCenterX,
    candidateCenterY,
    candidateRadius,
    accentColor,
    8,
    formData.candidateName || 'প্রার্থী'
  );

  // Optional Party Symbol Badge overlapping candidate frame
  const symbolName = formData.symbolName || dynamicTheme?.badgeText;
  if (symbolName) {
    const symbolRadius = 65;
    const symbolX = candidateCenterX + candidateRadius - 20;
    const symbolY = candidateCenterY + candidateRadius - 20;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(symbolX, symbolY, symbolRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = secondaryColor;
    ctx.stroke();

    ctx.font = 'bold 24px Kalpurush, Nirmala, sans-serif';
    ctx.fillStyle = '#B71C1C';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('মার্কা', symbolX, symbolY - 14);
    ctx.font = 'bold 28px Kalpurush, Nirmala, sans-serif';
    ctx.fillText(symbolName, symbolX, symbolY + 18);
    ctx.restore();
  }

  // 7. Candidate Information Card (Name, Designation, Party)
  let infoBoxY = candidateCenterY + candidateRadius + 45;

  // Candidate Name Ribbon
  const candidateName = formData.candidateName || 'জনপ্রিয় প্রার্থী';
  ctx.save();
  const nameBoxWidth = Math.min(width - 200, 800);
  const nameBoxHeight = 84;
  const nameBoxX = (width - nameBoxWidth) / 2;

  // Gradient Ribbon
  const ribbonGrad = ctx.createLinearGradient(nameBoxX, 0, nameBoxX + nameBoxWidth, 0);
  ribbonGrad.addColorStop(0, secondaryColor);
  ribbonGrad.addColorStop(0.5, '#D32F2F');
  ribbonGrad.addColorStop(1, secondaryColor);

  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = ribbonGrad;
  ctx.beginPath();
  ctx.roundRect(nameBoxX, infoBoxY, nameBoxWidth, nameBoxHeight, 16);
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Name Text
  ctx.font = 'bold 50px Kalpurush, Nirmala, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(candidateName, width / 2, infoBoxY + 58);
  ctx.restore();

  // Designation & Appeal
  const designation = formData.designation || 'আপনার দোয়া, সমর্থন ও মূল্যবান ভোট প্রার্থী';
  infoBoxY += nameBoxHeight + 36;

  ctx.save();
  ctx.font = 'bold 34px Kalpurush, Nirmala, sans-serif';
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 8;
  const desLines = wrapText(ctx, designation, width - 260);
  for (const dLine of desLines) {
    ctx.fillText(dLine, width / 2, infoBoxY);
    infoBoxY += 46;
  }
  ctx.restore();

  // Date and Venue badge (if provided)
  if (formData.eventDate || formData.venue) {
    infoBoxY += 10;
    const eventDetail = [formData.eventDate, formData.venue].filter(Boolean).join(' | ');
    ctx.save();
    ctx.font = '26px Kalpurush, Nirmala, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText(`📅 ${eventDetail}`, width / 2, infoBoxY);
    ctx.restore();
  }

  // 8. Footer Credit Line ("প্রচারে: ...")
  const footerText = `প্রচারে: ${formData.footerCredit || 'সর্বস্তরের জনগণ ও শুভাকাঙ্ক্ষীবৃন্দ'}`;
  const footerHeight = 90;
  const footerY = height - footerHeight - 38;

  ctx.save();
  // Footer banner strip
  const footerGrad = ctx.createLinearGradient(0, footerY, width, footerY);
  footerGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  footerGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.95)');
  footerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');

  ctx.fillStyle = footerGrad;
  ctx.fillRect(40, footerY, width - 80, footerHeight);

  // Top border line for footer
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(40, footerY);
  ctx.lineTo(width - 40, footerY);
  ctx.stroke();

  // Centered footer credit text
  ctx.font = 'bold 30px Kalpurush, Nirmala, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 6;
  ctx.fillText(footerText, width / 2, footerY + 54);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

export default renderPoster;
