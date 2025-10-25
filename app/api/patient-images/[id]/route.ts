import { type NextRequest, NextResponse } from "next/server";
import { PatientImage, connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

export async function GET(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await connectDB();
		const token = request.headers.get("authorization")?.split(" ")[1];
		if (!token)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const payload = verifyToken(token);
		if (!payload)
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });

		const image = await PatientImage.findById(params.id).populate(
			"uploadedBy",
			"name"
		);
		if (!image)
			return NextResponse.json({ error: "Image not found" }, { status: 404 });

		return NextResponse.json({ success: true, image });
	} catch (error) {
		console.error("  GET patient image error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch image" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await connectDB();
		const token = request.headers.get("authorization")?.split(" ")[1];
		if (!token)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const payload = verifyToken(token);
		if (!payload)
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });

		const image = await PatientImage.findByIdAndDelete(params.id);
		if (!image)
			return NextResponse.json({ error: "Image not found" }, { status: 404 });

		return NextResponse.json({
			success: true,
			message: "Image deleted successfully",
		});
	} catch (error) {
		console.error("  DELETE patient image error:", error);
		return NextResponse.json(
			{ error: "Failed to delete image" },
			{ status: 500 }
		);
	}
}
