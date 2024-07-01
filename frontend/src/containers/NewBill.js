import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`);
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  handleChangeFile = (e) => {
    e.preventDefault();
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    const file = fileInput.files[0];

    // Validate file type
    if (!this.isValidFileType(file)) {
      alert("Seuls les fichiers JPG, JPEG et PNG sont autorisés");
      fileInput.value = ""; // Clear the file input
      return;
    }

    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;
    formData.append("file", file);
    formData.append("email", email);

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true,
        },
      })
      .then(({ fileUrl, key }) => {
        console.log(fileUrl);
        this.billId = key;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
      })
      .catch((error) => console.error(error));
  };

  isValidFileType = (file) => {
    const acceptedTypes = ["image/jpeg", "image/jpg", "image/png"];
    return acceptedTypes.includes(file.type);
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const email = JSON.parse(localStorage.getItem("user")).email;
    const type = e.target.querySelector(`select[data-testid="expense-type"]`).value;
    const name = e.target.querySelector(`input[data-testid="expense-name"]`).value;
    const amount = parseInt(e.target.querySelector(`input[data-testid="amount"]`).value);
    const date = e.target.querySelector(`input[data-testid="datepicker"]`).value;
    const vat = e.target.querySelector(`input[data-testid="vat"]`).value;
    const pct = parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20;
    const commentary = e.target.querySelector(`textarea[data-testid="commentary"]`).value;

    // Validation: Check if any required field is empty
    if (!type || !name || !amount || !date || !vat || !commentary) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    const bill = {
      email,
      type,
      name,
      amount,
      date,
      vat,
      pct,
      commentary,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };
    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}
