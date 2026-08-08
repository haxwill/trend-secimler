import { NextResponse } from 'next/server';
import { POST as scrapeData } from '../scrape/route';

export async function GET(request: Request) {
    // Vercel Cron yetkilendirme kontrolü (Sadece Vercel Cron veya local trigger'a izin ver)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // Yapay zeka scrape rotasını tetikle (POST isteği gibi)
        const mockRequest = new Request(request.url, {
            method: 'POST',
            body: JSON.stringify({}), // .env içindeki GEMINI_API_KEY kullanılacak
        });

        const res = await scrapeData(mockRequest);
        const data = await res.json();

        if (res.ok) {
            return NextResponse.json({ message: 'Cron job basariyla calisti', count: data.count });
        } else {
            return NextResponse.json({ message: 'Cron job hata verdi', error: data.error }, { status: 500 });
        }
    } catch (e: any) {
        console.error("Cron Job Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
