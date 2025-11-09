import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function SystemDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics: DiagnosticResult[] = [];

    // 1. Check Supabase Connection
    try {
      const { data, error } = await supabase.from('menu_categories').select('count');
      if (error) throw error;
      diagnostics.push({
        name: 'Supabase Connection',
        status: 'success',
        message: 'Connected to Supabase',
        details: 'Database connection working'
      });
    } catch (error: any) {
      diagnostics.push({
        name: 'Supabase Connection',
        status: 'error',
        message: 'Failed to connect to Supabase',
        details: error.message
      });
    }

    // 2. Check Menu Categories
    try {
      const { data, error } = await supabase.from('menu_categories').select('*');
      if (error) throw error;
      diagnostics.push({
        name: 'Menu Categories',
        status: data && data.length > 0 ? 'success' : 'warning',
        message: `Found ${data?.length || 0} categories`,
        details: data?.length === 0 ? 'No categories found. Run ADD_SAMPLE_PRODUCTS.sql' : undefined
      });
    } catch (error: any) {
      diagnostics.push({
        name: 'Menu Categories',
        status: 'error',
        message: 'Failed to load categories',
        details: error.message
      });
    }

    // 3. Check Menu Items
    try {
      const { data, error } = await supabase.from('menu_items').select('*');
      if (error) throw error;
      const available = data?.filter(item => item.available).length || 0;
      diagnostics.push({
        name: 'Menu Items',
        status: data && data.length > 0 ? 'success' : 'warning',
        message: `Found ${data?.length || 0} items (${available} available)`,
        details: data?.length === 0 ? 'No products found. Run ADD_SAMPLE_PRODUCTS.sql' : undefined
      });
    } catch (error: any) {
      diagnostics.push({
        name: 'Menu Items',
        status: 'error',
        message: 'Failed to load menu items',
        details: error.message
      });
    }

    // 4. Check WhatsApp Sessions Table
    try {
      const { data, error } = await supabase.from('whatsapp_sessions').select('*');
      if (error) throw error;
      diagnostics.push({
        name: 'WhatsApp Sessions Table',
        status: 'success',
        message: `Table exists (${data?.length || 0} sessions)`,
        details: data?.length === 0 ? 'No active sessions' : 'Sessions found'
      });
    } catch (error: any) {
      diagnostics.push({
        name: 'WhatsApp Sessions Table',
        status: 'error',
        message: 'Table not found or inaccessible',
        details: 'Run CREATE_WHATSAPP_SESSIONS_TABLE.sql'
      });
    }

    // 5. Check Waiter API
    try {
      const response = await fetch('/api/admin/list-waiters');
      const data = await response.json();
      
      if (response.ok) {
        diagnostics.push({
          name: 'Waiter Management API',
          status: 'success',
          message: `API working (${data.waiters?.length || 0} waiters)`,
          details: 'Environment variables configured correctly'
        });
      } else {
        diagnostics.push({
          name: 'Waiter Management API',
          status: 'error',
          message: 'API error',
          details: data.error || 'Check environment variables in Cloudflare'
        });
      }
    } catch (error: any) {
      diagnostics.push({
        name: 'Waiter Management API',
        status: 'error',
        message: 'API not accessible',
        details: error.message
      });
    }

    // 6. Check WhatsApp Status API
    try {
      const response = await fetch('/api/whatsapp/status');
      const data = await response.json();
      
      if (response.ok) {
        diagnostics.push({
          name: 'WhatsApp Status API',
          status: data.connected ? 'success' : 'warning',
          message: data.message || (data.connected ? 'Connected' : 'Not connected'),
          details: data.phoneNumber || 'No active connection'
        });
      } else {
        diagnostics.push({
          name: 'WhatsApp Status API',
          status: 'error',
          message: 'API error',
          details: data.error || 'Unknown error'
        });
      }
    } catch (error: any) {
      diagnostics.push({
        name: 'WhatsApp Status API',
        status: 'warning',
        message: 'API not accessible',
        details: 'WhatsApp features may not work'
      });
    }

    // 7. Check Storage Bucket
    try {
      const { data, error } = await supabase.storage.from('product-images').list('', { limit: 1 });
      if (error) throw error;
      diagnostics.push({
        name: 'Product Images Storage',
        status: 'success',
        message: 'Storage bucket accessible',
        details: 'Can upload product images'
      });
    } catch (error: any) {
      diagnostics.push({
        name: 'Product Images Storage',
        status: 'warning',
        message: 'Storage bucket issue',
        details: 'Image uploads may not work'
      });
    }

    setResults(diagnostics);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              <span>System Diagnostics</span>
              <Button onClick={runDiagnostics} disabled={loading} size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{successCount}</div>
                <div className="text-sm text-gray-600">Passing</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{warningCount}</div>
                <div className="text-sm text-gray-600">Warnings</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{errorCount}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-3">
          {results.map((result, index) => (
            <Card key={index} className={`border-2 ${getStatusColor(result.status)}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(result.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{result.name}</h3>
                    <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-gray-600 mt-2 font-mono bg-white/50 p-2 rounded">
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        {(errorCount > 0 || warningCount > 0) && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {errorCount > 0 && (
                <div>
                  <p className="font-semibold text-red-700">Errors found:</p>
                  <ul className="list-disc list-inside ml-2 text-gray-700">
                    <li>Check environment variables in Cloudflare Pages</li>
                    <li>Run missing SQL scripts in Supabase</li>
                    <li>Verify database permissions (RLS policies)</li>
                  </ul>
                </div>
              )}
              {warningCount > 0 && (
                <div className="mt-3">
                  <p className="font-semibold text-yellow-700">Warnings found:</p>
                  <ul className="list-disc list-inside ml-2 text-gray-700">
                    <li>Some features may not work optimally</li>
                    <li>Check the documentation for setup instructions</li>
                    <li>Review QUICK_START_FIXES.md for solutions</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
