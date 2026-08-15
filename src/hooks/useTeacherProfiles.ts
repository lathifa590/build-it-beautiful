import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { FormData, Profile } from '@/types/modul';

interface TeacherProfile {
  id: string;
  user_id: string;
  name: string;
  data: Partial<FormData>;
  created_at: string;
  updated_at: string;
}

export const useTeacherProfiles = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-profiles', user?.id],
    queryFn: async (): Promise<Profile[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      return (data as TeacherProfile[]).map((tp) => ({
        name: tp.name,
        data: tp.data as Partial<FormData>,
      }));
    },
    enabled: !!user,
  });
};

export const useSaveTeacherProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, data }: { name: string; data: Partial<FormData> }) => {
      if (!user) throw new Error('User not authenticated');

      // Check if profile with this name exists
      const { data: existing } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', name)
        .single();

      // Convert FormData to JSON-safe format
      const jsonData = JSON.parse(JSON.stringify(data));

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('teacher_profiles')
          .update({ data: jsonData, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('teacher_profiles')
          .insert([{ user_id: user.id, name, data: jsonData }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profiles', user?.id] });
    },
  });
};

export const useDeleteTeacherProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('teacher_profiles')
        .delete()
        .eq('user_id', user.id)
        .eq('name', name);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profiles', user?.id] });
    },
  });
};

export const useMigrateLocalProfiles = () => {
  const { user } = useAuth();
  const saveProfile = useSaveTeacherProfile();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const localProfiles = localStorage.getItem('perangkat_ajar_profiles');
      if (!localProfiles) return { migrated: 0 };

      const profiles: Profile[] = JSON.parse(localProfiles);
      let migrated = 0;

      for (const profile of profiles) {
        try {
          await saveProfile.mutateAsync({ name: profile.name, data: profile.data });
          migrated++;
        } catch (error) {
          console.error(`Failed to migrate profile: ${profile.name}`, error);
        }
      }

      // Clear local storage after successful migration
      if (migrated > 0) {
        localStorage.removeItem('perangkat_ajar_profiles');
      }

      return { migrated };
    },
  });
};
