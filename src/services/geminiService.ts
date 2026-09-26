import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { PosterTheme } from '../utils/posterRenderer';

dotenv.config();

export interface GeminiPosterInput {
  occasion?: string;
  partyName?: string;
  candidateName?: string;
  designation?: string;
  customNotes?: string;
  slogan?: string;
  secondarySlogan?: string;
}

export interface PosterAISuggestion extends PosterTheme {
  suggestedFontSizes?: {
    headline?: number;
    candidateName?: number;
    designation?: number;
    footer?: number;
  };
  accentElements?: string[];
  themeDescription?: string;
}

/**
 * Intelligent deterministic fallback generator when Gemini API is unavailable or keys are invalid
 */
export function getLocalFallbackTheme(input: GeminiPosterInput): PosterAISuggestion {
  const occasion = (input.occasion || '').toLowerCase();
  const party = (input.partyName || '').toLowerCase();

  // 1. Victory Day / National Day Theme
  if (occasion.includes('victory') || occasion.includes('বিজয়') || occasion.includes('স্বাধীনতা') || occasion.includes('national')) {
    return {
      primaryColor: '#006A4E', // Bangladesh flag green
      secondaryColor: '#B71C1C', // Bangladesh flag crimson
      accentColor: '#FFD700', // Gold
      backgroundColor: '#071A12', // Deep forest night
      textColor: '#FFFFFF',
      bannerText: 'মহান বিজয় দিবসের রক্তিম শুভেচ্ছা',
      headline: input.slogan || 'বিজয়ের চেতনায় দেশ গড়ার শপথ নিন',
      secondarySlogan: input.secondarySlogan || 'লাখো শহীদের রক্তের বিনিময়ে অর্জিত স্বাধীনতা রক্ষা করবই',
      badgeText: '১৬ই ডিসেম্বর',
      accentElements: ['স্মৃতিসৌধের প্রতিকৃতি', 'লাল-সবুজ পতাকা', 'বিজয়ের সোনালী প্রতীক'],
      suggestedFontSizes: { headline: 56, candidateName: 52, designation: 34, footer: 30 },
      themeDescription: 'বাংলাদেশি জাতীয়তাবাদী ও মুক্তিযুদ্ধের লাল-সবুজ ঐতিহ্যবাহী বিজয় দিবস থিম',
    };
  }

  // 2. Condolence / Memorial Theme
  if (occasion.includes('condolence') || occasion.includes('শোক') || occasion.includes('শ্রদ্ধা') || occasion.includes('স্মরণ')) {
    return {
      primaryColor: '#1E293B', // Charcoal Slate
      secondaryColor: '#0F172A', // Deep Black
      accentColor: '#CBD5E1', // Silver
      backgroundColor: '#090D16', // Midnight Black
      textColor: '#F8FAFC',
      bannerText: 'গভীর শোক ও বিনম্র শ্রদ্ধাঞ্জলি',
      headline: input.slogan || 'বিনম্র শ্রদ্ধায় স্মরণ করি চির অম্লান স্মৃতি',
      secondarySlogan: input.secondarySlogan || 'আপনার আদর্শ আমাদের চলার পথের অনন্ত অনুপ্রেরণা',
      badgeText: 'স্মরণ সভা',
      accentElements: ['কালো ফিতা', 'শান্তির প্রতীক', 'শ্রদ্ধাঞ্জলির পুষ্পমাল্য'],
      suggestedFontSizes: { headline: 52, candidateName: 50, designation: 32, footer: 28 },
      themeDescription: 'গাম্ভীর্যপূর্ণ ও শ্রদ্ধাঞ্জলিমূলক শোক প্রকাশ থিম',
    };
  }

  // 3. Awami League Theme
  if (party.includes('আওয়ামী') || party.includes('awami') || party.includes('league') || party.includes('নৌকা')) {
    return {
      primaryColor: '#006A4E',
      secondaryColor: '#C62828',
      accentColor: '#FFD700',
      backgroundColor: '#0B1C14',
      textColor: '#FFFFFF',
      bannerText: 'জয় বাংলা জয় বঙ্গবন্ধু',
      headline: input.slogan || 'উন্নয়ন ও অগ্রযাত্রার ধারাবাহিকতা রক্ষায় ঐক্যবদ্ধ হোন',
      secondarySlogan: input.secondarySlogan || 'স্মার্ট বাংলাদেশ বিনির্মাণে নৌকা মার্কায় ভোট দিন',
      badgeText: 'নৌকা',
      accentElements: ['নৌকা মার্কা', 'জয় বাংলা স্লোগান', 'সোনালী বৃত্তাকার ফ্রেম'],
      suggestedFontSizes: { headline: 54, candidateName: 52, designation: 34, footer: 30 },
      themeDescription: 'বাংলাদেশ আওয়ামী লীগের ঐতিহ্যবাহী সবুজ-লাল-সোনালী নির্বাচনী ক্যাম্পেইন থিম',
    };
  }

  // 4. BNP Theme
  if (party.includes('বিএনপি') || party.includes('bnp') || party.includes('জাতীয়তাবাদী') || party.includes('ধানের')) {
    return {
      primaryColor: '#1565C0', // Royal Blue
      secondaryColor: '#006A4E', // Green
      accentColor: '#FFC107', // Amber Gold
      backgroundColor: '#0A192F', // Deep Navy
      textColor: '#FFFFFF',
      bannerText: 'বাংলাদেশ জিন্দাবাদ',
      headline: input.slogan || 'গণতন্ত্র পুনরুদ্ধার ও দেশ রক্ষার আন্দোলনে এগিয়ে আসুন',
      secondarySlogan: input.secondarySlogan || 'জনগণের ভোটাধিকার প্রতিষ্ঠায় ধানের শীষে ভোট দিন',
      badgeText: 'ধানের শীষ',
      accentElements: ['ধানের শীষ প্রতীক', 'নীল-সবুজ ব্যানার', 'গণতান্ত্রিক সোনালী ব্যাজ'],
      suggestedFontSizes: { headline: 54, candidateName: 52, designation: 34, footer: 30 },
      themeDescription: 'বাংলাদেশ জাতীয়তাবাদী দল (বিএনপি)-এর রয়্যাল ব্লু ও ধানের শীষ ক্যাম্পেইন থিম',
    };
  }

  // 5. Default General Campaign / Election Theme
  return {
    primaryColor: '#0D47A1',
    secondaryColor: '#B71C1C',
    accentColor: '#F59E0B',
    backgroundColor: '#091528',
    textColor: '#FFFFFF',
    bannerText: 'বিসমিল্লাহির রাহমানির রাহীম',
    headline: input.slogan || 'জনগণের সেবায় নিবেদিত প্রাণ, যোগ্য নেতৃত্বের সন্ধান',
    secondarySlogan: input.secondarySlogan || 'আসন্ন নির্বাচনে আপনার মূল্যবান সমর্থন ও ভোট কামনা করছি',
    badgeText: 'ভোট দিন',
    accentElements: ['ভোটের ব্যালট ব্যাজ', 'উজ্জ্বল গোল্ডেন বর্ডার', 'উদ্বোধনী ফিতা'],
    suggestedFontSizes: { headline: 54, candidateName: 50, designation: 34, footer: 30 },
    themeDescription: 'সার্বজনীন উচ্চ-কনট্রাস্ট নির্বাচনী প্রচারণা পোস্টার থিম',
  };
}

/**
 * Service to suggest poster colors, fonts, and slogans using Google Gemini
 */
export async function suggestPosterStyling(input: GeminiPosterInput): Promise<PosterAISuggestion> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Check if API key is provided and not default placeholder
  if (!apiKey || apiKey === 'your_gemini_api_key' || apiKey.trim() === '') {
    console.log('ℹ️ Using local dynamic theme engine (GEMINI_API_KEY not set or placeholder).');
    return getLocalFallbackTheme(input);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert graphic designer and political branding specialist for Bangladesh elections and festivals.
Analyze the following user input and generate a stunning visual theme, high-contrast color palette, and rhyming Bengali slogans for an authentic Bangladeshi political/greeting poster:

Candidate Name: "${input.candidateName || ''}"
Designation: "${input.designation || ''}"
Party: "${input.partyName || ''}"
Occasion: "${input.occasion || ''}"
Custom Notes: "${input.customNotes || ''}"
User Slogan: "${input.slogan || ''}"

Return ONLY a valid JSON object matching this exact schema (no markdown, no code blocks):
{
  "primaryColor": "Hex code for main gradient/header (e.g. #006A4E)",
  "secondaryColor": "Hex code for secondary accents/ribbons (e.g. #B71C1C)",
  "accentColor": "Hex code for highlights, borders, and main titles (e.g. #FFD700)",
  "backgroundColor": "Hex code for poster deep background (e.g. #0A192F)",
  "textColor": "#FFFFFF",
  "bannerText": "Top Bangla religious or patriotic invocation (e.g. 'বিসমিল্লাহির রাহমানির রাহীম' or 'জয় বাংলা')",
  "headline": "Catchy, authentic Bengali campaign headline or festival greeting slogan",
  "secondarySlogan": "Inspiring secondary Bengali appeal or slogan line",
  "badgeText": "Short badge text (e.g. 'মার্কা', 'ভোট দিন', '১৬ই ডিসেম্বর', 'শোক সভা')",
  "themeDescription": "Short 1-sentence explanation of this design aesthetic in Bengali or English"
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean JSON response
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      primaryColor: parsed.primaryColor || '#006A4E',
      secondaryColor: parsed.secondaryColor || '#B71C1C',
      accentColor: parsed.accentColor || '#FFD700',
      backgroundColor: parsed.backgroundColor || '#0B1320',
      textColor: parsed.textColor || '#FFFFFF',
      bannerText: parsed.bannerText || 'বিসমিল্লাহির রাহমানির রাহীম',
      headline: parsed.headline || input.slogan || 'আসন্ন নির্বাচনে মূল্যবান ভোট দিন',
      secondarySlogan: parsed.secondarySlogan || input.secondarySlogan || 'উন্নয়ন ও অগ্রযাত্রায় এগিয়ে চলুন',
      badgeText: parsed.badgeText || 'ভোট দিন',
      themeDescription: parsed.themeDescription || 'AI Suggested Political Poster Theme',
      suggestedFontSizes: { headline: 54, candidateName: 52, designation: 34, footer: 30 },
      accentElements: ['সোনালী বর্ডার', 'বৃত্তাকার লিডার ফ্রেম', 'ক্যাম্পেইন রিবন'],
    };
  } catch (error: any) {
    console.warn('⚠️ Gemini API error, falling back to local theme engine:', error.message || error);
    return getLocalFallbackTheme(input);
  }
}

export default {
  suggestPosterStyling,
  getLocalFallbackTheme,
};
