/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  let newBill;
  let onNavigate;

  beforeEach(() => {
    document.body.innerHTML = NewBillUI();
    onNavigate = jest.fn();
    localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "test@test.com" }));
    newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage });
  });

  describe("When I am on NewBill Page", () => {
    test("Then the form is displayed", () => {
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });
  });

  describe("When I upload a file", () => {
    test("Then the file should be uploaded if it has a valid type", async () => {
      const fileInput = screen.getByTestId("file");
      const file = new File(["image"], "image.png", { type: "image/png" });

      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(newBill.isValidFileType(file)).toBe(true);
      expect(fileInput.files[0]).toBe(file);
    });

    test("Then it should not accept files of invalid type", () => {
      const fileInput = screen.getByTestId("file");
      const file = new File(["document"], "document.pdf", { type: "application/pdf" });

      window.alert = jest.fn();
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(newBill.isValidFileType(file)).toBe(false);
      expect(window.alert).toHaveBeenCalledWith("Seuls les fichiers JPG, JPEG et PNG sont autorisés");
      expect(fileInput.value).toBe("");
    });
  });

  describe("When I submit the form with valid data", () => {
    test("Then it should create a new bill", () => {
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");

      const typeInput = screen.getByTestId("expense-type");
      fireEvent.change(typeInput, { target: { value: "Transports" } });

      const nameInput = screen.getByTestId("expense-name");
      fireEvent.change(nameInput, { target: { value: "Train ticket" } });

      const amountInput = screen.getByTestId("amount");
      fireEvent.change(amountInput, { target: { value: "100" } });

      const dateInput = screen.getByTestId("datepicker");
      fireEvent.change(dateInput, { target: { value: "2022-07-01" } });

      const vatInput = screen.getByTestId("vat");
      fireEvent.change(vatInput, { target: { value: "20" } });

      const pctInput = screen.getByTestId("pct");
      fireEvent.change(pctInput, { target: { value: "20" } });

      const commentaryInput = screen.getByTestId("commentary");
      fireEvent.change(commentaryInput, { target: { value: "Business trip" } });

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });

    test("Then it should show an alert if required fields are missing", () => {
      window.alert = jest.fn();
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const form = screen.getByTestId("form-new-bill");

      const typeInput = screen.getByTestId("expense-type");
      fireEvent.change(typeInput, { target: { value: "" } }); // Required field missing

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("Veuillez remplir tous les champs");
    });
  });

  describe("When isValidFileType", () => {
    test("should return true for valid file types", () => {
      const validFile = new File(["image"], "image.png", { type: "image/png" });
      expect(newBill.isValidFileType(validFile)).toBe(true);
    });

    test("should return false for invalid file types", () => {
      const invalidFile = new File(["document"], "document.pdf", { type: "application/pdf" });
      expect(newBill.isValidFileType(invalidFile)).toBe(false);
    });
  });

  describe("When updateBill", () => {
    test("should call store.bills().update with correct data", async () => {
      const bill = {
        email: "test@test.com",
        type: "Transports",
        name: "Train ticket",
        amount: 100,
        date: "2022-07-01",
        vat: "20",
        pct: 20,
        commentary: "Business trip",
        fileUrl: "http://localhost:8000/test.png",
        fileName: "test.png",
        status: "pending",
      };

      newBill.fileUrl = "http://localhost:8000/test.png";
      newBill.fileName = "test.png";
      newBill.billId = "12345";

      const updateSpy = jest.spyOn(mockStore.bills(), "update");

      await newBill.updateBill(bill);
      expect(updateSpy).toHaveBeenCalledWith({ data: JSON.stringify(bill), selector: newBill.billId });
    });
  });
});
