'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ImportStats {
  total: number;
  successful: number;
  failed: number;
}

export default function LeadImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      setFile(null);
      return;
    }

    const text = await selectedFile.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1, 6).filter(line => line.trim()).map(line => {
      const values = line.split(',');
      return headers.reduce((obj: any, header, idx) => {
        obj[header] = values[idx]?.trim() || '';
        return obj;
      }, {});
    });

    setPreview(data);
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());

      const leads = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',');
          return headers.reduce((obj: any, header, idx) => {
            obj[header] = values[idx]?.trim() || '';
            return obj;
          }, {});
        });

      const token = 'cookie';
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leads }),
      });

      if (!response.ok) throw new Error('Failed to import leads');
      const data = await response.json();
      setStats(data.data?.stats);

      setTimeout(() => {
        router.push('/dashboard/leads');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">Import Leads</h1>
          <Link href="/dashboard/leads" className="text-gray-600 hover:text-black">
            ← Back
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {error && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg mb-6">
            <p className="text-neutral-800">{error}</p>
          </div>
        )}

        {stats ? (
          <div className="space-y-4 text-center">
            <div className="text-6xl font-bold text-neutral-600">✓</div>
            <h2 className="text-2xl font-bold text-black">Import Complete!</h2>
            <div className="grid grid-cols-3 gap-4 my-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-black">{stats.total}</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-800">Successful</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.successful}</p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <p className="text-sm text-neutral-800">Failed</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.failed}</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Redirecting to leads page...</p>
          </div>
        ) : (
          <>
            <div className="bg-neutral-50 p-6 rounded-lg mb-8 border border-neutral-200">
              <h3 className="font-semibold text-neutral-900 mb-2">CSV Format Required</h3>
              <p className="text-sm text-neutral-800">
                Your CSV should have columns: firstName, lastName, email, company (optional), phone (optional), title (optional), location (optional)
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-8">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer">
                <div className="text-4xl mb-2">📁</div>
                <p className="font-semibold text-black mb-1">
                  {file ? file.name : 'Drop CSV file here or click to select'}
                </p>
                <p className="text-sm text-gray-600">Maximum file size: 10MB</p>
              </label>
            </div>

            {preview.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-black mb-4">Preview (first 5 rows)</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {Object.keys(preview[0]).map(key => (
                          <th key={key} className="text-left px-4 py-2 text-black font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          {Object.values(row).map((val: any, idx2) => (
                            <td key={idx2} className="px-4 py-2 text-gray-600">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 font-medium"
              >
                {loading ? 'Importing...' : 'Import Leads'}
              </button>
              <Link
                href="/dashboard/leads"
                className="flex-1 px-6 py-3 border border-gray-300 text-black rounded-lg hover:border-black text-center font-medium"
              >
                Cancel
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
