
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';import { cookies } from 'next/headers';
import { z } from 'zod';

const profileSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
});

const addressSchema = z.object({
  address_line1: z.string().min(1, "Address Line 1 is required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postal_code: z.string().min(1, "Postal Code is required"),
  country: z.string().min(1, "Country is required"),
  is_default: z.boolean().default(false),
  phone: z.string().min(1, "Phone number is required"),
});

export async function getProfile() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, phone, gender, date_of_birth')
    .eq('id', user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfile(formData: FormData) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const parsed = profileSchema.parse({
    full_name: formData.get('full_name'),
    phone: formData.get('phone'),
    gender: formData.get('gender'),
    date_of_birth: formData.get('date_of_birth'),
  });

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed)
    .eq('id', user.id);

  if (error) {
    throw error;
  }

  return data;
}

export async function getAddresses() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  return data;
}

export async function createAddress(formData: FormData) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const parsed = addressSchema.parse({
    address_line1: formData.get('address_line1'),
    address_line2: formData.get('address_line2'),
    city: formData.get('city'),
    state: formData.get('state'),
    postal_code: formData.get('postal_code'),
    country: formData.get('country'),
    is_default: formData.get('is_default') === 'on',
    phone: formData.get('phone'),
  });

  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({ ...parsed, user_id: user.id });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAddress(id: string, formData: FormData) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const parsed = addressSchema.parse({
    address_line1: formData.get('address_line1'),
    address_line2: formData.get('address_line2'),
    city: formData.get('city'),
    state: formData.get('state'),
    postal_code: formData.get('postal_code'),
    country: formData.get('country'),
    is_default: formData.get('is_default') === 'on',
    phone: formData.get('phone'),
  });

  const { data, error } = await supabase
    .from('customer_addresses')
    .update(parsed)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteAddress(id: string) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function setDefaultAddress(id: string) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // First, set all other addresses to not default
  await supabase
    .from('customer_addresses')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .neq('id', id);

  // Then, set the selected address as default
  const { data, error } = await supabase
    .from('customer_addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }

  return data;
}
