angular.module("pharmacyApp").controller("LoginController", [
  "$scope",
  function ($scope) {
    $scope.loginData = {
      email: "",
      password: "",
    };

    $scope.login = function () {
      // TODO: Implement login logic
      console.log("Login attempt", $scope.loginData);
    };
  },
]);
