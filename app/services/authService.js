angular.module("pharmacyApp").service("AuthService", [
  "$http",
  "$q",
  "SUPABASE_CONFIG",
  function ($http, $q, SUPABASE_CONFIG) {
    const supabaseClient = supabase.createClient(
      SUPABASE_CONFIG.PROJECT_URL,
      SUPABASE_CONFIG.API_KEY,
    );

    this.login = async function (email, password) {
      const result = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
      });

      return result;
    };

    this.logout = async function () {
      return await supabaseClient.auth.signOut();
    };

    this.getCurrentUser = async function () {
      const result = await supabaseClient.auth.getUser();
      return result;
    };
    this.isAdmin = async function (userId) {
      try {
        const response = await $http({
          method: "GET",
          url: SUPABASE_CONFIG.API_URL + "admins?id=eq." + userId,
          headers: {
            apikey: SUPABASE_CONFIG.API_KEY,
            Authorization: "Bearer " + SUPABASE_CONFIG.API_KEY,
          },
        });

        console.log("Checking admin for userId:", userId);
        console.log("Admins response:", response.data);

        return response.data.length > 0;
      } catch (error) {
        console.error("Admin check failed:", error);
        return false;
      }
    };
  },
]);
