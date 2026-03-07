// !This file controlls the medicines view and its calling of the data from medsService.js
angular.module("pharmacyApp").controller("MedicineController", [
  "$scope",
  "MedsService",
  function ($scope, MedsService) {
    $scope.medicines = [];
    $scope.isEditMode = false;
    $scope.selectedMedicine = {};
    $scope.errorMessage = "";
    $scope.successMessage = "";
    $scope.loading = true;
    $scope.expiryError = "";

    // Fetch all medicines
    function loadMedicines() {
      $scope.loading = true;
      MedsService.getAll()
        .then(function (response) {
          $scope.medicines = response.data;
          $scope.loading = false;
        })
        .catch(function (error) {
          console.error("Error fetching medicines:", error);
          $scope.errorMessage = "Failed to load medicines.";
          $scope.loading = false;
        });
    }

    loadMedicines();

    // Save or update medicine
    $scope.saveMedicine = function (form) {
      $scope.errorMessage = "";
      $scope.successMessage = "";
      $scope.expiryError = "";

      if (form.$invalid) {
        $scope.errorMessage = "Please fix the highlighted fields first.";
        return;
      }

      // Validate expiry date
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var expDate = new Date($scope.selectedMedicine.expiry_date);
      if (expDate <= today) {
        $scope.expiryError = "Expiry date must be in the future.";
        return;
      }

      var payload = {
        name: $scope.selectedMedicine.name,
        price: Number($scope.selectedMedicine.price),
        stock: Number($scope.selectedMedicine.stock),
        expiry_date: $scope.selectedMedicine.expiry_date,
      };

      if ($scope.isEditMode) {
        MedsService.update($scope.selectedMedicine.id, payload)
          .then(function () {
            $scope.errorMessage = "";
            $scope.successMessage = "Medicine updated successfully.";
            loadMedicines();
            $scope.resetForm(form);
          })
          .catch(function (error) {
            $scope.successMessage = "";
            $scope.errorMessage = "Failed to update medicine.";
            console.error("Update error:", error);
          });
      } else {
        MedsService.create(payload)
          .then(function () {
            $scope.errorMessage = "";
            $scope.successMessage = "Medicine added successfully.";
            loadMedicines();
            $scope.resetForm(form);
          })
          .catch(function (error) {
            $scope.successMessage = "";
            $scope.errorMessage = "Failed to add medicine.";
            console.error("Create error:", error);
          });
      }
    };

    // Edit medicine
    $scope.editMedicine = function (med) {
      $scope.errorMessage = "";
      $scope.successMessage = "";

      $scope.selectedMedicine = {
        id: med.id,
        name: med.name,
        price: med.price,
        stock: med.stock,
        expiry_date: med.expiry_date,
      };

      $scope.isEditMode = true;
    };

    // Delete medicine
    $scope.deleteMedicine = function (id) {
      if (confirm("Are you sure you want to delete this medicine?")) {
        MedsService.remove(id)
          .then(function () {
            $scope.successMessage = "Medicine deleted successfully.";
            loadMedicines();
          })
          .catch(function (error) {
            console.error("Error deleting medicine:", error);
            $scope.errorMessage = "Failed to delete medicine.";
          });
      }
    };

    // Get stock status
    $scope.getStockStatus = function (stock) {
      if (stock == 0) return "Out of Stock";
      if (stock <= 10) return "Low Stock";
      return "Available";
    };

    // Reset form
    $scope.resetForm = function (form) {
      $scope.selectedMedicine = {
        name: "",
        price: "",
        stock: "",
        expiry_date: "",
      };

      $scope.isEditMode = false;
      $scope.errorMessage = "";
      $scope.successMessage = "";
      $scope.expiryError = "";

      if (form) {
        form.$setPristine();
        form.$setUntouched();
        form.$submitted = false;
      }
    };
  },
]);
