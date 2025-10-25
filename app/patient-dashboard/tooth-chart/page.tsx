"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { ToothChartVisual } from "@/components/tooth-chart-visual";

interface ToothChartData {
	_id: string;
	teeth: Record<number, { status: string; notes?: string }>;
	overallNotes: string;
	lastReview: string;
}

export default function ToothChartPage() {
	const { patient, patientToken } = useAuth();
	const [toothChart, setToothChart] = useState<ToothChartData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedToothNotes, setSelectedToothNotes] = useState<string>("");
	const { toast } = useToast();

	useEffect(() => {
		if (patient && patientToken) {
			fetchToothChart(patientToken, patient._id);
		}
	}, [patient, patientToken]);

	const fetchToothChart = async (token: string, patientId: string) => {
		try {
			setError(null);
			console.log("  Fetching tooth chart for patient:", patientId);

			const response = await fetch(`/api/tooth-chart?patientId=${patientId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			console.log("  Tooth chart response status:", response.status);

			if (!response.ok) {
				const errorData = await response.json();
				console.error("  Tooth chart error response:", errorData);
				throw new Error(errorData.error || "Failed to fetch tooth chart");
			}

			const data = await response.json();
			console.log("  Tooth chart data received:", data);
			setToothChart(data.toothChart || null);

			if (!data.toothChart) {
				setError(
					"No tooth chart data available yet. Please contact your dentist."
				);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error occurred";
			console.error("  Error fetching tooth chart:", errorMessage);
			setError(errorMessage);
			toast({
				description: `Failed to load tooth chart: ${errorMessage}`,
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleToothClick = (toothNumber: number) => {
		const toothData = toothChart?.teeth?.[toothNumber];
		if (toothData?.notes) {
			setSelectedToothNotes(`Tooth #${toothNumber}: ${toothData.notes}`);
		} else {
			setSelectedToothNotes(`Tooth #${toothNumber}: No notes available`);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<p className="text-muted-foreground">Loading tooth chart...</p>
			</div>
		);
	}

  return (
    <ProtectedRoute patientOnly={true}>
      <div className="flex h-screen bg-background">
        <main className="flex-1  lg:ml-0">
          <div className="">
            {/* Header */}
            <div className="dashboard-header mb-8">
              <div>
                <h1 className="dashboard-title sm:text-3xl text-2xl">Tooth Chart</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">Your dental treatment status</p>
              </div>
            </div>

						{/* Content */}
						{error && (
							<Card className="p-6 mb-6 border-red-200 bg-red-50">
								<p className="text-red-700">{error}</p>
							</Card>
						)}

						{!toothChart ? (
							<Card className="p-8 text-center">
								<p className="text-muted-foreground">
									No tooth chart data available yet
								</p>
							</Card>
						) : (
							<div className="space-y-6">
								<Card className="p-6">
									<h2 className="text-xl font-bold text-foreground mb-6">
										Dental Chart
									</h2>
									<div className="bg-muted/50 p-6 rounded-lg overflow-x-auto">
										<ToothChartVisual
											teeth={toothChart.teeth || {}}
											onToothClick={handleToothClick}
											readOnly={true}
										/>
									</div>
								</Card>

								{selectedToothNotes && (
									<Card className="p-6 border-blue-200 bg-blue-50">
										<h3 className="font-semibold text-foreground mb-2">
											Tooth Details
										</h3>
										<p className="text-foreground">{selectedToothNotes}</p>
									</Card>
								)}

								{/* Overall Notes */}
								{toothChart.overallNotes && (
									<Card className="p-6">
										<h3 className="text-lg font-bold text-foreground mb-3">
											Overall Notes
										</h3>
										<p className="text-muted-foreground">
											{toothChart.overallNotes}
										</p>
									</Card>
								)}

								{/* Last Review */}
								{toothChart.lastReview && (
									<Card className="p-6 bg-accent/5">
										<p className="text-sm text-muted-foreground">Last Review</p>
										<p className="text-foreground font-medium mt-1">
											{new Date(toothChart.lastReview).toLocaleDateString()}
										</p>
									</Card>
								)}
							</div>
						)}
					</div>
				</main>
			</div>
		</ProtectedRoute>
	);
}
