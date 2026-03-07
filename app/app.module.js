angular.module("pharmacyApp", ["ngRoute"]).run([
  "$rootScope",
  "$location",
  "AuthService",
  function ($rootScope, $location, AuthService) {
    $rootScope.$on("$routeChangeStart", async function (event, next) {
      if (!next || !next.$$route) return;

      const path = next.$$route.originalPath;

      if (path === "/login") {
        return;
      }

      if (path.startsWith("/admin")) {
        try {
          const result = await AuthService.getCurrentUser();
          const user = result.data.user;

          if (!user) {
            event.preventDefault();
            $location.path("/login");
            $rootScope.$applyAsync();
            return;
          }

          const allowed = await AuthService.isAdmin(user.id);

          if (!allowed) {
            await AuthService.logout();
            event.preventDefault();
            $location.path("/login");
            $rootScope.$applyAsync();
          }
        } catch (error) {
          console.error("Route protection error:", error);
          event.preventDefault();
          $location.path("/login");
          $rootScope.$applyAsync();
        }
      }
    });
  },
]);
