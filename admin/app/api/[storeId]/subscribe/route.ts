import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request, { params }: { params: Promise<{ storeId: string }> }) {
    const { email } = await req.json();
    const { storeId } = await params;

    const trimmedEmail = typeof email === "string" ? email.trim() : "";

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return new NextResponse("Valid email is required", { status: 400, headers: corsHeaders });
    }

    const normalizedEmail = trimmedEmail.toLowerCase();

    try {
        await prismadb.subscriber.create({
            data: {
                storeId: storeId,
                email: normalizedEmail,
            }
        });

        return NextResponse.json({ success: true }, { status: 201, headers: corsHeaders });
    } catch (err) {
        if ((err as { code?: string }).code === "P2002") {
            return NextResponse.json({ error: "duplicate" }, { status: 409, headers: corsHeaders });
        }

        console.log("[SUBSCRIBE_POST]", err);
        return new NextResponse("Internal error", { status: 500, headers: corsHeaders });
    }
}
