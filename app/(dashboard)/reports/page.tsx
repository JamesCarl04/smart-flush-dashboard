"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { FileBarChart, Download, FileText, FileSpreadsheet, FileJson, Clock, CheckCircle2 } from "lucide-react";

type ReportType = 'usage_summary' | 'water_consumption' | 'alert_history' | 'maintenance_log';
type ExportFormat = 'PDF' | 'CSV' | 'JSON';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('usage_summary');
  const [dateRange, setDateRange] = useState('7d');
  const [formatType, setFormatType] = useState<ExportFormat>('PDF');
  const [isGenerating, setIsGenerating] = useState(false);

  // Report history — will be populated from Firestore once report generation writes records.
  const recentReports: { id: string; name: string; type: string; date: Date; size: string; format: string }[] = [];

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, dateRange, format: formatType })
      });

      if (!res.ok) throw new Error('Failed to generate report');

      // Native browser trick to prompt download for a blob response
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Attempt to extract filname from header
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = `report.${formatType.toLowerCase()}`;
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report generated successfully');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const FormatIcon = ({ fmt, className }: { fmt: string, className?: string }) => {
    switch (fmt) {
      case 'PDF': return <FileText className={className} />;
      case 'CSV': return <FileSpreadsheet className={className} />;
      case 'JSON': return <FileJson className={className} />;
      default: return <FileText className={className} />;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-fade-in relative pb-20">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-primary" />
          Data Exports & Reports
        </h1>
        <p className="text-base-content/60 mt-2">Generate tailored analytics reports and download historical system logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Generator */}
        <div className="lg:col-span-1 border border-base-200 bg-base-100 rounded-xl shadow-xl overflow-hidden self-start">
          <div className="bg-base-200 px-6 py-4 border-b border-base-300">
            <h2 className="font-semibold text-lg flex items-center gap-2 text-primary">
              <Download className="w-5 h-5" /> Report Builder
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="form-control w-full">
              <label className="label"><span className="label-text font-medium text-base-content/80">Report Type</span></label>
              <select 
                className="select select-bordered w-full" 
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              >
                <option value="usage_summary">Usage Summary</option>
                <option value="water_consumption">Water Consumption</option>
                <option value="alert_history">Alert History</option>
                <option value="maintenance_log">Maintenance Logs</option>
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label"><span className="label-text font-medium text-base-content/80">Date Range</span></label>
              <select 
                className="select select-bordered w-full"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label"><span className="label-text font-medium text-base-content/80">Export Format</span></label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {['PDF', 'CSV', 'JSON'].map((fmt) => (
                  <button
                    key={fmt}
                    className={`btn btn-sm h-12 flex flex-col items-center justify-center gap-1 border-base-300 ${formatType === fmt ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20 hover:border-primary' : 'bg-base-100'}`}
                    onClick={() => setFormatType(fmt as ExportFormat)}
                  >
                    <FormatIcon fmt={fmt} className="w-4 h-4" />
                    <span className="text-[10px]">{fmt}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button 
                className="btn btn-primary w-full shadow-lg h-12"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Generating File...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-1" />
                    Generate & Download
                  </>
                )}
              </button>
              <p className="text-center text-xs text-base-content/40 mt-3 flex justify-center items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-success" /> Securely generated over HTTPS
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Reports */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body p-0">
              <div className="px-6 py-4 border-b border-base-200 flex justify-between items-center">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary" /> Recent Exports
                </h2>
              </div>

              <div className="overflow-x-auto w-full pb-4">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-base-200/50">
                      <th className="font-medium text-base-content/60">Report Name</th>
                      <th className="font-medium text-base-content/60">Generated</th>
                      <th className="font-medium text-base-content/60">Format</th>
                      <th className="font-medium text-base-content/60">Size</th>
                      <th className="font-medium text-base-content/60 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.map(report => (
                      <tr key={report.id} className="hover">
                        <td>
                          <div className="font-semibold">{report.name}</div>
                          <div className="text-xs text-base-content/50 uppercase">{report.type.replace('_', ' ')}</div>
                        </td>
                        <td className="text-sm">
                          {format(report.date, 'MMM dd, yyyy')}
                          <div className="text-xs text-base-content/50">{format(report.date, 'HH:mm')}</div>
                        </td>
                        <td>
                          <div className={`badge badge-sm font-medium ${report.format === 'PDF' ? 'badge-error badge-outline' : report.format === 'CSV' ? 'badge-success badge-outline' : 'badge-warning badge-outline'}`}>
                            {report.format}
                          </div>
                        </td>
                        <td className="text-sm text-base-content/70">{report.size}</td>
                        <td className="text-right">
                          <button className="btn btn-ghost btn-sm text-primary">Download</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>

      <Toaster position="top-right" />
    </div>
  );
}
