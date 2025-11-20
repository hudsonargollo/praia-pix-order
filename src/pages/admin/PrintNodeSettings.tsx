import { useState, useEffect } from 'react';
import { printNodeClient } from '@/integrations/printnode/client';
import { UniformHeader } from '@/components/UniformHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Printer, Check, X, RefreshCw } from 'lucide-react';

interface Printer {
  id: number;
  name: string;
  description: string;
  state: string;
}

const PrintNodeSettings = () => {
  const [apiKey, setApiKey] = 