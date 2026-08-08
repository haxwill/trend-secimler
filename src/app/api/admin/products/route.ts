import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const postsFile = path.join(process.cwd(), 'data', 'posts.json');
  try {
    if (!fs.existsSync(postsFile)) {
      return NextResponse.json([]);
    }
    const data = fs.readFileSync(postsFile, 'utf8');
    const products = JSON.parse(data);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read products' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const postsFile = path.join(process.cwd(), 'data', 'posts.json');
    
    if (!fs.existsSync(postsFile)) {
      return NextResponse.json({ error: 'Products file not found' }, { status: 404 });
    }
    
    const data = fs.readFileSync(postsFile, 'utf8');
    let products = JSON.parse(data);
    
    products = products.filter((p: any) => p.id !== id);
    
    fs.writeFileSync(postsFile, JSON.stringify(products, null, 4));
    
    return NextResponse.json({ success: true, count: products.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
