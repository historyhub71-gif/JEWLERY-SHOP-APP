import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Supabase environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client using the logged-in user's JWT
    const supabaseUser = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization:
              req.headers.get("Authorization") ?? "",
          },
        },
      }
    );

    // Get currently logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
    console.error("AUTH ERROR:", userError);

    return new Response(
        JSON.stringify({
            error: userError?.message || "Unauthorized. Please login first.",
        }),
        {
            status: 401,
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
}
    // Service-role client
    // IMPORTANT: This key stays ONLY inside Supabase Edge Function.
    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    // Check caller's profile
    const {
      data: callerProfile,
      error: callerError,
    } = await supabaseAdmin
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();
      console.log("CREATE ADMIN DEBUG:", {
      userId: user.id,
      callerProfile,
      callerError,
      });

    if (
    callerError ||
    !callerProfile ||
    callerProfile.role !== "super_admin" ||
    callerProfile.status !== "approved"
) {
    console.error("PROFILE AUTH ERROR:", {
        callerError,
        callerProfile,
        userId: user.id,
    });

    return new Response(
        JSON.stringify({
            error: callerError?.message ||
                "Only an approved Super Admin can create admins.",
            profile: callerProfile || null,
        }),
        {
            status: 403,
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
}

    // Read request body
    const {
      fullName,
      email,
      phone,
      city,
      address,
      password,
    } = await req.json();

    // Validate required fields
    if (
      !fullName?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !city?.trim() ||
      !address?.trim() ||
      !password
    ) {
      return new Response(
        JSON.stringify({
          error: "All admin fields are required.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Password validation
    if (password.length < 6) {
      return new Response(
        JSON.stringify({
          error: "Password must contain at least 6 characters.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create Auth user
    const {
      data: authData,
      error: authError,
    } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({
          error:
            authError?.message ||
            "Unable to create admin account.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const newAdminId = authData.user.id;

    // Create admin profile
    const {
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newAdminId,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
        role: "admin",
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      });

    // If profile creation fails, remove Auth user
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newAdminId);

      return new Response(
        JSON.stringify({
          error:
            profileError.message ||
            "Admin profile could not be created.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin created successfully.",
        admin: {
          id: newAdminId,
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          role: "admin",
          status: "approved",
        },
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Create admin error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});