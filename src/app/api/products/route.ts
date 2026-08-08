import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/db';

export async function GET() {
  try {
    const data = await getProducts();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Veri okuma hatası:", error);
    return NextResponse.json({ error: 'Veri bulunamadı veya okunamadı' }, { status: 500 });
  }
}
