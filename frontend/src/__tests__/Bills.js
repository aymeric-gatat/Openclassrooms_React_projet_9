/**
 * @jest-environment jsdom
 */

import { ROUTES_PATH } from "../constants/routes.js";
import Bills from "../containers/Bills.js";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { screen, waitFor, fireEvent } from "@testing-library/dom";

import router from "../app/Router.js";
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //to-do write expect expression
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML);
      const antiChrono = (a, b) => {
        if (a.date > b.date) return 1;
        if (a.date < b.date) return -1;
      };
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    //** =================================================== **//
    describe("When I click on the Eye icon", () => {
      test("Then it should open a modal with bill image", () => {
        document.body.innerHTML = `<div data-testid="icon-eye" data-bill-url="https://www.shutterstock.com/image-vector/default-ui-image-placeholder-wireframes-600nw-1037719192.jpg"></div><div id="modaleFile" class="modal"><div class="modal-body"></div></div>`;
        const onNavigate = jest.fn();
        const billContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        $.fn.modal = jest.fn(); // mock jQuery modal function

        const eyeIcon = screen.getByTestId("icon-eye");
        fireEvent.click(eyeIcon);

        expect($.fn.modal).toHaveBeenCalled();
        expect(screen.getByAltText("Bill")).toBeTruthy();
      });
    });
    describe("When I click on the New Bill button", () => {
      test("Then it should navigate to NewBill page", () => {
        const onNavigate = jest.fn();
        document.body.innerHTML = `<button data-testid="btn-new-bill">New Bill</button>`;

        const billContainer = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });

        const newBillButton = screen.getByTestId("btn-new-bill");
        fireEvent.click(newBillButton);

        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
      });
    });
  });
  describe("When I navigate to Bills Page", () => {
    test("Then fetches bills from mock API GET", async () => {
      const onNavigate = jest.fn();
      const billContainer = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const bills = await billContainer.getBills();

      expect(bills.length).toBe(4); // Assuming there are 4 bills in the mock
    });
  });
});
