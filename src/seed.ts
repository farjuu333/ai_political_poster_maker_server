import dns from 'dns';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from './models/Template';

dotenv.config();

// Ensure SRV DNS records resolve reliably on Windows networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore if custom DNS is restricted
}

const defaultTemplates = [
  {
    title: 'মহান বিজয় দিবস - রক্তিম শুভেচ্ছা ও শ্রদ্ধাঞ্জলি',
    occasionType: 'victory_day',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    layoutConfig: {
      width: 1200,
      height: 1600,
      aspectRatio: '3:4',
      palette: ['#006A4E', '#B71C1C', '#FFD700', '#071A12', '#FFFFFF'],
      background: {
        gradient: 'linear-gradient(180deg, #006A4E 0%, #071A12 55%, #050B14 100%)',
        color: '#071A12',
      },
      elements: [
        {
          id: 'header-banner',
          type: 'text',
          defaultContent: 'মহান বিজয় দিবসের রক্তিম শুভেচ্ছা',
          fontSize: 26,
          color: '#FFD700',
          x: 600,
          y: 70,
        },
        {
          id: 'leader-left',
          type: 'leader_photo',
          x: 140,
          y: 175,
          width: 140,
          height: 140,
          maxPhotos: 1,
        },
        {
          id: 'leader-right',
          type: 'leader_photo',
          x: 1060,
          y: 175,
          width: 140,
          height: 140,
          maxPhotos: 1,
        },
        {
          id: 'main-headline',
          type: 'text',
          defaultContent: 'বিজয়ের চেতনায় দেশ গড়ার শপথ নিন',
          fontSize: 54,
          color: '#FFD700',
          x: 600,
          y: 280,
        },
        {
          id: 'candidate-portrait',
          type: 'image',
          x: 600,
          y: 680,
          width: 420,
          height: 420,
        },
        {
          id: 'candidate-name',
          type: 'text',
          defaultContent: 'আলহাজ্ব মো: রফিকুল ইসলাম',
          fontSize: 50,
          color: '#FFFFFF',
          x: 600,
          y: 1180,
        },
        {
          id: 'footer-credit',
          type: 'text',
          defaultContent: 'প্রচারে: সর্বস্তরের মুক্তিকামী জনগণ',
          fontSize: 30,
          color: '#FFFFFF',
          x: 600,
          y: 1530,
        },
      ],
    },
  },
  {
    title: 'গভীর শোক ও বিনম্র শ্রদ্ধাঞ্জলি',
    occasionType: 'condolence',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    layoutConfig: {
      width: 1200,
      height: 1600,
      aspectRatio: '3:4',
      palette: ['#1E293B', '#0F172A', '#CBD5E1', '#090D16', '#F8FAFC'],
      background: {
        gradient: 'linear-gradient(180deg, #1E293B 0%, #090D16 60%, #000000 100%)',
        color: '#090D16',
      },
      elements: [
        {
          id: 'header-banner',
          type: 'text',
          defaultContent: 'ইন্না লিল্লাহি ওয়া ইন্না ইলাইহি রাজিউন',
          fontSize: 26,
          color: '#CBD5E1',
          x: 600,
          y: 70,
        },
        {
          id: 'main-headline',
          type: 'text',
          defaultContent: 'গভীর শোক ও বিনম্র শ্রদ্ধাঞ্জলি',
          fontSize: 52,
          color: '#FFFFFF',
          x: 600,
          y: 280,
        },
        {
          id: 'sub-headline',
          type: 'text',
          defaultContent: 'আমরা মরহুমের বিদেহী আত্মার মাগফিরাত কামনা করছি',
          fontSize: 32,
          color: '#CBD5E1',
          x: 600,
          y: 350,
        },
        {
          id: 'memorial-portrait',
          type: 'image',
          x: 600,
          y: 680,
          width: 420,
          height: 420,
        },
        {
          id: 'footer-credit',
          type: 'text',
          defaultContent: 'শোকাহত: পরিবারবর্গ ও সর্বস্তরের শুভাকাঙ্ক্ষী',
          fontSize: 30,
          color: '#FFFFFF',
          x: 600,
          y: 1530,
        },
      ],
    },
  },
  {
    title: 'আসন্ন নির্বাচনী প্রচারণা ও গণসংযোগ',
    occasionType: 'election_campaign',
    thumbnailUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&auto=format&fit=crop&q=80',
    isActive: true,
    layoutConfig: {
      width: 1200,
      height: 1600,
      aspectRatio: '3:4',
      palette: ['#0D47A1', '#B71C1C', '#F59E0B', '#091528', '#FFFFFF'],
      background: {
        gradient: 'linear-gradient(180deg, #0D47A1 0%, #091528 55%, #050B14 100%)',
        color: '#091528',
      },
      elements: [
        {
          id: 'header-banner',
          type: 'text',
          defaultContent: 'বিসমিল্লাহির রাহমানির রাহীম',
          fontSize: 26,
          color: '#F59E0B',
          x: 600,
          y: 70,
        },
        {
          id: 'leader-left',
          type: 'leader_photo',
          x: 140,
          y: 175,
          width: 140,
          height: 140,
          maxPhotos: 1,
        },
        {
          id: 'leader-right',
          type: 'leader_photo',
          x: 1060,
          y: 175,
          width: 140,
          height: 140,
          maxPhotos: 1,
        },
        {
          id: 'main-headline',
          type: 'text',
          defaultContent: 'আসন্ন নির্বাচনে মূল্যবান ভোট দিয়ে জয়যুক্ত করুন',
          fontSize: 54,
          color: '#F59E0B',
          x: 600,
          y: 280,
        },
        {
          id: 'candidate-portrait',
          type: 'image',
          x: 600,
          y: 680,
          width: 420,
          height: 420,
        },
        {
          id: 'party-symbol',
          type: 'party_symbol',
          x: 820,
          y: 890,
          width: 130,
          height: 130,
        },
        {
          id: 'candidate-name',
          type: 'text',
          defaultContent: 'আলহাজ্ব মো: রফিকুল ইসলাম',
          fontSize: 50,
          color: '#FFFFFF',
          x: 600,
          y: 1180,
        },
        {
          id: 'candidate-designation',
          type: 'text',
          defaultContent: 'সাধারণ সম্পাদক পদপ্রার্থী',
          fontSize: 34,
          color: '#F59E0B',
          x: 600,
          y: 1260,
        },
        {
          id: 'footer-credit',
          type: 'text',
          defaultContent: 'প্রচারে: এলাকাবাসী ও দলীয় সর্বস্তরের নেতাকর্মীবৃন্দ',
          fontSize: 30,
          color: '#FFFFFF',
          x: 600,
          y: 1530,
        },
      ],
    },
  },
];

export async function seedTemplates(): Promise<void> {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    console.log('🌱 Connecting to MongoDB Atlas for template seeding...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB.');

    for (const tpl of defaultTemplates) {
      const updated = await Template.findOneAndUpdate(
        { title: tpl.title },
        { $set: tpl },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✨ Seeded template: "${updated.title}" [${updated.occasionType}] (ID: ${updated._id})`);
    }

    const totalCount = await Template.countDocuments();
    console.log(`\n🎉 Seeding completed successfully! Total templates in database: ${totalCount}`);
  } catch (error: any) {
    console.error('❌ Error during template seeding:', error.message || error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

// Execute directly if run as a script
if (require.main === module || process.argv[1]?.includes('seed')) {
  seedTemplates();
}

export default seedTemplates;
