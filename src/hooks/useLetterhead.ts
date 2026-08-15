import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LetterheadData {
  url: string | null;
  isEnabled: boolean;
}

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export const useLetterhead = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEnabled, setIsEnabled] = useState(false);

  // Fetch letterhead URL from profile
  const { data: letterheadUrl, isLoading } = useQuery({
    queryKey: ['letterhead', user?.id],
    queryFn: async (): Promise<string | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('letterhead_url')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching letterhead:', error);
        return null;
      }

      return data?.letterhead_url || null;
    },
    enabled: !!user,
  });

  // Load toggle state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('letterhead_enabled');
    if (saved !== null) {
      setIsEnabled(JSON.parse(saved));
    }
  }, []);

  // Save toggle state to localStorage
  const toggleLetterhead = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem('letterhead_enabled', JSON.stringify(enabled));
  }, []);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');

      // Validate file
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Format tidak didukung. Gunakan JPEG atau PNG.');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Ukuran file maksimal 500KB.');
      }

      const fileExt = file.type === 'image/png' ? 'png' : 'jpg';
      const filePath = `${user.id}/letterhead.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('letterheads')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Gagal mengupload gambar. Silakan coba lagi.');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('letterheads')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`; // Cache bust

      // Update profile with new URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ letterhead_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error('Gagal menyimpan URL kop sekolah.');
      }

      return publicUrl;
    },
    onSuccess: (newUrl) => {
      queryClient.setQueryData(['letterhead', user?.id], newUrl);
      queryClient.invalidateQueries({ queryKey: ['letterhead', user?.id] });
      // Auto-enable when uploaded
      toggleLetterhead(true);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      // List files to delete
      const { data: files } = await supabase.storage
        .from('letterheads')
        .list(user.id);

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from('letterheads').remove(filePaths);
      }

      // Clear URL in profile
      const { error } = await supabase
        .from('profiles')
        .update({ letterhead_url: null })
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(['letterhead', user?.id], null);
      toggleLetterhead(false);
    },
  });

  // Convert image URL to base64 for export
  const getBase64 = useCallback(async (): Promise<string | null> => {
    if (!letterheadUrl) return null;

    try {
      const response = await fetch(letterheadUrl);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting to base64:', error);
      return null;
    }
  }, [letterheadUrl]);

  return {
    letterheadUrl,
    isEnabled: isEnabled && !!letterheadUrl,
    isLoading,
    hasLetterhead: !!letterheadUrl,
    toggleLetterhead,
    uploadLetterhead: uploadMutation.mutate,
    deleteLetterhead: deleteMutation.mutate,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    uploadError: uploadMutation.error?.message,
    getBase64,
    // Expose raw toggle state for UI
    rawEnabled: isEnabled,
  };
};
