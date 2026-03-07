angular.module("pharmacyApp").controller("LoginController", [
  "$scope",
  "$location",
  "AuthService",
  function ($scope, $location, AuthService) {
    $scope.loginData = {
      email: "",
      password: "",
    };

    $scope.errorMessage = "";
    $scope.isLoading = false;

    $scope.login = async function () {
      $scope.errorMessage = "";
      $scope.isLoading = true;
      $scope.$applyAsync();

      try {
        const result = await AuthService.login(
          $scope.loginData.email,
          $scope.loginData.password,
        );

        if (result.error) {
          $scope.errorMessage = result.error.message || "Login failed";
          return;
        }

        const user = result.data.user;

        console.log("Logged in user:", user);
        console.log("Logged in user id:", user.id);
        console.log("Logged in email:", user.email);

        if (!user) {
          $scope.errorMessage = "No user returned from login";
          return;
        }

        const allowed = await AuthService.isAdmin(user.id);
        console.log("Is allowed:", allowed);

        if (!allowed) {
          await AuthService.logout();
          $scope.errorMessage = "You are not authorized to access admin panel";
          return;
        }

        $location.path("/admin/dashboard");
        $scope.$applyAsync();
      } catch (error) {
        console.error(error);
        $scope.errorMessage = "Something went wrong during login";
      } finally {
        $scope.isLoading = false;
        $scope.$applyAsync();
      }
    };
  },
]);
