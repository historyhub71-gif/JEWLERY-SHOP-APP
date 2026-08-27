import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async req => {
    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            return new Response(
                JSON.stringify({
                    error: 'Method not allowed',
                }),
                {
                    status: 405,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        // Supabase environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Client using the logged-in user's JWT
        const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: req.headers.get('Authorization') ?? '',
                },
            },
        });

        // Get currently logged-in user
        const {
            data: { user },
            error: userError,
        } = await supabaseUser.auth.getUser();

        if (userError || !user) {
            console.error('AUTH ERROR:', userError);

            return new Response(
                JSON.stringify({
                    error: userError?.message || 'Unauthorized. Please login first.',
                }),
                {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        // Service-role client
        // IMPORTANT:
        // This key stays ONLY inside the Edge Function.
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // Check caller's profile
        const { data: callerProfile, error: callerError } = await supabaseAdmin
            .from('profiles')
            .select('role, status')
            .eq('id', user.id)
            .single();

        console.log('DELETE ADMIN DEBUG:', {
            userId: user.id,
            callerProfile,
            callerError,
        });

        // Only approved Super Admin can delete admins
        if (
            callerError ||
            !callerProfile ||
            callerProfile.role !== 'super_admin' ||
            callerProfile.status !== 'approved'
        ) {
            console.error('PROFILE AUTH ERROR:', {
                callerError,
                callerProfile,
                userId: user.id,
            });

            return new Response(
                JSON.stringify({
                    error:
                        callerError?.message || 'Only an approved Super Admin can delete admins.',
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        // Read request body
        const { adminId } = await req.json();

        // Validate admin ID
        if (!adminId) {
            return new Response(
                JSON.stringify({
                    error: 'Admin ID is required.',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        // Prevent Super Admin from deleting themselves
        if (adminId === user.id) {
            return new Response(
                JSON.stringify({
                    error: 'You cannot delete your own Super Admin account.',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        // Find the selected admin
        const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, email, role, status')
            .eq('id', adminId)
            .single();

        if (adminProfileError || !adminProfile) {
            return new Response(
                JSON.stringify({
                    error: 'Administrator not found.',
                }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        // Make sure the selected account is actually an admin
        if (adminProfile.role !== 'admin') {
            return new Response(
                JSON.stringify({
                    error: 'Only administrator accounts can be deleted here.',
                }),
                {
                    status: 403,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        // Delete the Auth account
        console.log('STARTING AUTH DELETE:', adminId);

        const { data: deletedUser, error: deleteAuthError } =
            await supabaseAdmin.auth.admin.deleteUser(adminId);

        console.log('AUTH DELETE RESULT:', {
            deletedUser,
            deleteAuthError,
        });

        if (deleteAuthError) {
            console.error('DELETE AUTH USER ERROR:', deleteAuthError);

            return new Response(
                JSON.stringify({
                    success: false,
                    error: deleteAuthError.message || 'Unable to delete administrator account.',
                }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        console.log('AUTH USER DELETED SUCCESSFULLY:', adminId);

        // Delete profile record
        const { error: deleteProfileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', adminId);

        if (deleteProfileError) {
            console.error('DELETE PROFILE ERROR:', deleteProfileError);

            return new Response(
                JSON.stringify({
                    error: 'Admin login account was deleted, but the profile could not be deleted.',
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        // Success
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Administrator deleted successfully.',
                admin: {
                    id: adminId,
                    full_name: adminProfile.full_name,
                    email: adminProfile.email,
                },
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    } catch (error) {
        console.error('DELETE ADMIN ERROR:', error);

        return new Response(
            JSON.stringify({
                error: 'Internal server error.',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    }
});
