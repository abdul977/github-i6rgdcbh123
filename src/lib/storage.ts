import { supabase } from '@/integrations/supabase/client';

export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${path}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { url: null, error: error as Error };
  }
};

export const deleteFile = async (
  bucket: string,
  path: string
): Promise<{ error: Error | null }> => {
  try {
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (deleteError) {
      throw deleteError;
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { error: error as Error };
  }
};

export const listFiles = async (
  bucket: string,
  path: string = ''
): Promise<{ files: string[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path);

    if (error) {
      throw error;
    }

    return { 
      files: data.map(file => file.name), 
      error: null 
    };
  } catch (error) {
    console.error('Error listing files:', error);
    return { files: [], error: error as Error };
  }
};