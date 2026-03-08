angular.module("pharmacyApp").controller("AppController", [
  "$scope",
  "$location",
  "AuthService",
  function ($scope, $location, AuthService) {
    $scope.showNavbar = function () {
      return $location.path() !== "/login";
    };

    $scope.isActive = function (path) {
      return $location.path() === path;
    };

    $scope.logout = async function () {
      try {
        await AuthService.logout();
        $location.path("/login");
        $scope.$applyAsync();
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };
  },
]);