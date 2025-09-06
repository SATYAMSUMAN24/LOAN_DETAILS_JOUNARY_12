// Global state management
let currentStep = 0; // Start with loan selection
let formData = {
    loanAmount: 1000000, // Default 10 lakhs
    interestRate: 8.5,
    tenure: 84
};
let uploadedDocuments = {};
let selectedEmploymentSubType = 'salaried'; // Track employment sub-type

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    updateStepDisplay();
    setupEventListeners();
    setupAutoCalculations();
    setupNumberFormatting();
    setupTenureSlider();
    setApplicationDate();
    updateEmploymentSubTypeVisibility(); // Initialize employment sub-type visibility
    updateDocumentVisibility(); // Initialize document visibility
    
    // Ensure loan selection page is shown by default
    showLoanSelection();
});

// Setup event listeners
function setupEventListeners() {
    // Selection button handlers
    const selectionButtons = document.querySelectorAll('.selection-btn');
    selectionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const group = this.closest('.selection-group');
            const buttons = group.querySelectorAll('.selection-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Get group label to determine what was selected
            const groupLabel = group.querySelector('label').textContent.toLowerCase();
            
            // Handle loan type selection to show/hide sub-type
            if (this.dataset.value === 'vehicle' && groupLabel.includes('loan type')) {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'block';
            } else if (groupLabel.includes('loan type') && this.dataset.value !== 'vehicle') {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'none';
            }

            // Update document visibility when loan type changes
            if (groupLabel.includes('loan type')) {
                updateDocumentVisibility();
            }

            // Track employment type changes
            if (groupLabel.includes('employment type') && !groupLabel.includes('sub')) {
                formData.employmentType = this.dataset.value;
                updateEmploymentSubTypeVisibility();
                updateIncomeFormVisibility();
            }

            // Track employment sub-type changes
            if (groupLabel.includes('employment sub type')) {
                selectedEmploymentSubType = this.dataset.value;
                formData.employmentSubType = this.dataset.value;
                updateDocumentVisibility();
                updateIncomeFormVisibility();
                updatePersonalFormVisibility();
            }
            
            // Save selection data immediately
            saveSelectionData();
        });
    });

    // Form input handlers for data persistence
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', saveFormData);
        input.addEventListener('input', saveFormData);
    });

    // Verify button handlers for both individual and business forms
    const verifyBtns = document.querySelectorAll('.verify-btn');
    verifyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const container = this.closest('.mobile-input-container');
            const mobileInput = container.querySelector('input[type="text"]');

            if (mobileInput.value && validateMobile(mobileInput.value)) {
                showOTPModal(mobileInput.value);
            } else {
                showError('Please enter a valid 10-digit mobile number');
            }
        });
    });

    // Existing customer dropdown handler
    const existingCustomerSelect = document.getElementById('existingCustomer');
    if (existingCustomerSelect) {
        existingCustomerSelect.addEventListener('change', function() {
            const cifField = document.getElementById('cifNumber');
            if (this.value === 'yes') {
                cifField.required = true;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Enter your CIF number';
            } else if (this.value === 'no') {
                cifField.required = false;
                cifField.value = '';
                cifField.disabled = true;
                cifField.style.backgroundColor = '#f0f0f0';
                cifField.placeholder = 'Not applicable';
            } else {
                // If no option selected, reset to default
                cifField.required = false;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Select existing customer first';
            }
        });
    }

    // Existing customer dropdown handler for company form
    const existingCustomerCompanySelect = document.getElementById('existingCustomerCompany');
    if (existingCustomerCompanySelect) {
        existingCustomerCompanySelect.addEventListener('change', function() {
            const cifField = document.getElementById('cifNumberCompany');
            if (this.value === 'yes') {
                cifField.required = true;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Enter your CIF number';
            } else if (this.value === 'no') {
                cifField.required = false;
                cifField.value = '';
                cifField.disabled = true;
                cifField.style.backgroundColor = '#f0f0f0';
                cifField.placeholder = 'Not applicable';
            } else {
                // If no option selected, reset to default
                cifField.required = false;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Select existing customer first';
            }
        });
    }
}

// Navigation functions
function nextStep() {
    if (validateCurrentStep()) {
        saveFormData();
        currentStep++;

        // Handle special navigation
        if (currentStep === 5) {
            // After step 4 (offer), go to document upload
            updateStepDisplay();
        } else if (currentStep === 6) {
            // After document upload, go to final approval
            updateStepDisplay();
        } else {
            updateStepDisplay();
            updateProgressStepper();
        }
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;

        if (currentStep === 5) {
            // Going back to document upload
            updateStepDisplay();
        } else if (currentStep >= 1 && currentStep <= 4) {
            // Normal steps with progress stepper
            updateStepDisplay();
            updateProgressStepper();
        } else {
            // Loan selection page
            updateStepDisplay();
        }
    }
}

function startApplication() {
    if (!validateLoanSelection()) {
        return;
    }
    
    saveSelectionData();
    currentStep = 1;
    updateStepDisplay();
    updateProgressStepper();
    
    // Ensure forms are updated based on selections
    updateBasicFormVisibility();
    updateEmploymentSubTypeVisibility();
    updateDocumentVisibility();
}

// Display management
function updateStepDisplay() {
    // Hide all step contents
    const stepContents = document.querySelectorAll('.step-content');
    stepContents.forEach(content => {
        content.style.display = 'none';
    });

    // Hide/show progress stepper based on current step
    const progressStepper = document.querySelector('.progress-stepper');
    if (progressStepper) {
        if (currentStep === 0 || currentStep >= 5) {
            progressStepper.style.display = 'none';
        } else {
            progressStepper.style.display = 'flex';
        }
    }

    // Show current step
    if (currentStep === 0) {
        // Loan selection page
        const loanSelection = document.getElementById('loan-selection');
        if (loanSelection) {
            loanSelection.style.display = 'block';
        }
    } else if (currentStep >= 1 && currentStep <= 4) {
        // Normal application steps
        const currentStepElement = document.getElementById(`step-${currentStep}`);
        if (currentStepElement) currentStepElement.style.display = 'block';
    } else if (currentStep === 5) {
        // Document upload page
        const documentUpload = document.getElementById('document-upload');
        if (documentUpload) documentUpload.style.display = 'block';
    } else if (currentStep === 6) {
        // Final approval page
        const finalApproval = document.getElementById('final-approval');
        if (finalApproval) finalApproval.style.display = 'block';
    } else if (currentStep === 7) {
        // Thank you page
        const thankYou = document.getElementById('thank-you');
        if (thankYou) thankYou.style.display = 'block';
    }

    // Update EMI calculation when showing offer
    if (currentStep === 4) {
        calculateEMI();
    }

    // Update form visibility when showing basic details step
    if (currentStep === 1) {
        updateBasicFormVisibility();
    }

    // Update form visibility when showing personal details step
    if (currentStep === 2) {
        updatePersonalFormVisibility();
    }

    // Update form visibility when showing income details step
    if (currentStep === 3) {
        updateIncomeFormVisibility();
    }
}

function updateProgressStepper() {
    const steps = document.querySelectorAll('.step[data-step]');
    steps.forEach(step => {
        const stepNumber = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');

        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

// Validation functions
function validateCurrentStep() {
    switch (currentStep) {
        case 0:
            return validateLoanSelection();
        case 1:
            return validateBasicDetails();
        case 2:
            return validatePersonalDetails();
        case 3:
            return validateIncomeDetails();
        case 4:
            return true; // Offer page
        case 5:
            return validateDocumentUpload();
        default:
            return true;
    }
}

function validateLoanSelection() {
    const loanTypeSelected = document.querySelector('.selection-btn.active[data-value]');
    if (!loanTypeSelected) {
        showError('Please select a loan type to continue');
        return false;
    }
    
    // Check if vehicle loan is selected and sub-type is required
    if (loanTypeSelected.dataset.value === 'vehicle') {
        const subTypeSection = document.getElementById('loan-sub-type');
        if (subTypeSection && subTypeSection.style.display !== 'none') {
            const subTypeSelected = document.querySelector('#loan-sub-type .selection-btn.active[data-value]');
            if (!subTypeSelected) {
                showError('Please select a vehicle sub-type (2 Wheeler or 4 Wheeler)');
                return false;
            }
        }
    }
    
    // Check employment type selection
    const employmentTypeSelected = document.querySelector('[data-value="individual"].active, [data-value="non-individual"].active, [data-value="nri"].active');
    if (!employmentTypeSelected) {
        showError('Please select an employment type');
        return false;
    }
    
    // Check employment sub-type selection
    const employmentSubTypeSelected = document.querySelector('.employment-sub-type-btn.active[data-value]');
    if (!employmentSubTypeSelected) {
        showError('Please select an employment sub-type');
        return false;
    }
    
    return true;
}

function validateDocumentUpload() {
    let requiredDocs = ['bankStatement', 'itrDoc']; // Always required for both individual and non-individual
    
    // Get selected loan type and employment type
    const activeLoanType = document.querySelector('.selection-btn.active[data-value]')?.dataset.value || formData.selections?.loan_type;
    const employmentType = formData.employmentType || 'individual';
    const employmentSubType = formData.employmentSubType || 'salaried';
    
    // Determine if this should be treated as non-individual for document purposes
    const isNonIndividualForDocs = employmentType === 'non-individual' || 
        (employmentType === 'individual' && 
         (employmentSubType === 'llp-partnership' || employmentSubType === 'private-limited'));
    
    if (isNonIndividualForDocs) {
        // NON-INDIVIDUAL LOGIC (including LLP/Partnership and Private Limited individuals):
        requiredDocs.push('gstDoc'); // GST always required for non-individual types
        
        if (activeLoanType === 'vehicle') {
            // Vehicle loan (2wheeler or 4wheeler): ALL 4 documents (GST, bank statement, ITR, dealer invoice)
            requiredDocs.push('dealerInvoice');
        }
        // For home, personal, education loans: GST, bank statement, ITR (NO dealer invoice)
    } else {
        // INDIVIDUAL LOGIC (including NRI and other individual sub-types):
        if (activeLoanType === 'vehicle') {
            // Vehicle loan (2wheeler or 4wheeler): ITR, bank statement, dealer invoice (NO GST)
            requiredDocs.push('dealerInvoice');
        }
        // For home, personal, education loans: only ITR and bank statement required (NO dealer invoice, NO GST)
    }

    const allUploaded = requiredDocs.every(docId => uploadedDocuments[docId] && uploadedDocuments[docId].verified);

    if (!allUploaded) {
        const missingDocs = requiredDocs.filter(docId => !uploadedDocuments[docId] || !uploadedDocuments[docId].verified);
        showError(`Please upload all required documents. Missing: ${missingDocs.join(', ')}`);
        return false;
    }
    return true;
}

function validateBasicDetails() {
    clearFieldErrors();

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        return validateNonIndividualBasicDetails();
    } else {
        return validateIndividualBasicDetails();
    }
}

function validateIndividualBasicDetails() {
    const fullName = document.getElementById('fullName').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const loanAmount = document.getElementById('loanAmount').value.trim();
    const panNumber = document.getElementById('panNumber').value.trim();
    const ovdType = document.getElementById('ovdType').value;
    const ovdNumber = document.getElementById('ovdNumber').value.trim();
    const agreeOVD = document.getElementById('agreeOVD').checked;

    let isValid = true;

    if (!fullName) {
        showFieldError('fullName', 'Please enter your full name');
        isValid = false;
    }

    if (!mobile || !validateMobile(mobile)) {
        showFieldError('mobile', 'Please enter a valid 10-digit mobile number');
        isValid = false;
    }

    if (!loanAmount || parseFloat(removeCommas(loanAmount)) <= 0) {
        showFieldError('loanAmount', 'Please enter a valid loan amount');
        isValid = false;
    } else {
        const cleanAmount = removeCommas(loanAmount);
        const parsedAmount = parseFloat(cleanAmount);
        
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
            formData.loanAmount = parsedAmount;
        } else {
            showFieldError('loanAmount', 'Please enter a valid loan amount');
            isValid = false;
        }
    }

    if (!panNumber || !validatePAN(panNumber)) {
        showFieldError('panNumber', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
        isValid = false;
    }

    if (!ovdType) {
        showFieldError('ovdType', 'Please select an OVD type');
        isValid = false;
    }

    if (!ovdNumber) {
        showFieldError('ovdNumber', 'Please enter the document number');
        isValid = false;
    } else {
        // Validate OVD number based on type
        let ovdValid = false;
        switch(ovdType) {
            case 'aadhar':
                ovdValid = validateAadhar(ovdNumber);
                break;
            case 'passport':
                ovdValid = validatePassport(ovdNumber);
                break;
            case 'driving_license':
                ovdValid = validateDrivingLicense(ovdNumber);
                break;
            case 'voter_id':
                ovdValid = validateVoterID(ovdNumber);
                break;
            case 'pan_card':
                ovdValid = validatePAN(ovdNumber);
                break;
        }
        
        if (!ovdValid) {
            showFieldError('ovdNumber', 'Please enter a valid document number');
            isValid = false;
        }
    }

    // Check if OVD is verified
    const ovdVerifyBtn = document.getElementById('ovdVerifyBtn');
    if (ovdVerifyBtn && (!ovdVerifyBtn.disabled || !ovdVerifyBtn.textContent.includes('Verified'))) {
        showError('Please verify your OVD document first');
        isValid = false;
    }

    if (!agreeOVD) {
        showError('Please agree to validate OVD details');
        isValid = false;
    }

    const agreeTerms = document.getElementById('agreeTerms').checked;
    if (!agreeTerms) {
        showError('Please agree to the Terms & Conditions and Privacy Policy');
        isValid = false;
    }

    const agreeConsent = document.getElementById('agreeConsent').checked;
    if (!agreeConsent) {
        showError('Please provide consent for communication');
        isValid = false;
    }

    const agreeDisclosure = document.getElementById('agreeDisclosure').checked;
    if (!agreeDisclosure) {
        showError('Please agree to the information disclosure terms');
        isValid = false;
    }

    const agreeDirectorDeclaration = document.getElementById('agreeDirectorDeclaration').checked;
    if (!agreeDirectorDeclaration) {
        showError('Please agree to the director declaration');
        isValid = false;
    }

    return isValid;
}

function validateNonIndividualBasicDetails() {
    const fullName = document.getElementById('businessFullName').value.trim();
    const mobile = document.getElementById('businessMobile').value.trim();
    const loanAmount = document.getElementById('businessLoanAmount').value.trim();
    const panNumber = document.getElementById('businessPanNumber').value.trim();
    const ovdType = document.getElementById('businessOVDType').value;
    const ovdNumber = document.getElementById('businessOVDNumber').value.trim();
    const agreeOVD = document.getElementById('businessAgreeOVD').checked;

    let isValid = true;

    if (!fullName) {
        showFieldError('businessFullName', 'Please enter your full name');
        isValid = false;
    }

    if (!mobile || !validateMobile(mobile)) {
        showFieldError('businessMobile', 'Please enter a valid 10-digit mobile number');
        isValid = false;
    }

    if (!loanAmount || parseFloat(removeCommas(loanAmount)) <= 0) {
        showFieldError('businessLoanAmount', 'Please enter a valid loan amount');
        isValid = false;
    } else {
        const cleanAmount = removeCommas(loanAmount);
        const parsedAmount = parseFloat(cleanAmount);
        
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
            formData.loanAmount = parsedAmount;
        } else {
            showFieldError('businessLoanAmount', 'Please enter a valid loan amount');
            isValid = false;
        }
    }

    if (!panNumber || !validatePAN(panNumber)) {
        showFieldError('businessPanNumber', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
        isValid = false;
    }

    if (!ovdType) {
        showFieldError('businessOVDType', 'Please select an OVD type');
        isValid = false;
    }

    if (!ovdNumber) {
        showFieldError('businessOVDNumber', 'Please enter the document number');
        isValid = false;
    } else {
        // Validate business OVD number based on type
        let ovdValid = false;
        switch(ovdType) {
            case 'aadhar':
                ovdValid = validateAadhar(ovdNumber);
                break;
            case 'passport':
                ovdValid = validatePassport(ovdNumber);
                break;
            case 'driving_license':
                ovdValid = validateDrivingLicense(ovdNumber);
                break;
            case 'voter_id':
                ovdValid = validateVoterID(ovdNumber);
                break;
            case 'pan_card':
                ovdValid = validatePAN(ovdNumber);
                break;
        }
        
        if (!ovdValid) {
            showFieldError('businessOVDNumber', 'Please enter a valid document number');
            isValid = false;
        }
    }

    // Check if business OVD is verified
    const businessOVDVerifyBtn = document.getElementById('businessOVDVerifyBtn');
    if (businessOVDVerifyBtn && (!businessOVDVerifyBtn.disabled || !businessOVDVerifyBtn.textContent.includes('Verified'))) {
        showError('Please verify your OVD document first');
        isValid = false;
    }

    if (!agreeOVD) {
        showError('Please agree to validate OVD details');
        isValid = false;
    }

    const agreeTerms = document.getElementById('businessAgreeTerms').checked;
    if (!agreeTerms) {
        showError('Please agree to the Terms & Conditions and Privacy Policy');
        isValid = false;
    }

    const agreeConsent = document.getElementById('businessAgreeConsent').checked;
    if (!agreeConsent) {
        showError('Please provide consent for communication');
        isValid = false;
    }

    const agreeDisclosure = document.getElementById('businessAgreeDisclosure').checked;
    if (!agreeDisclosure) {
        showError('Please agree to the information disclosure terms');
        isValid = false;
    }

    const agreeDirectorDeclaration = document.getElementById('businessAgreeDirectorDeclaration').checked;
    if (!agreeDirectorDeclaration) {
        showError('Please agree to the director declaration');
        isValid = false;
    }

    return isValid;
}

function validatePersonalDetails() {
    clearFieldErrors();

    const employmentType = formData.employmentType || 'individual';
    const employmentSubType = formData.employmentSubType || 'salaried';

    if (employmentType === 'non-individual' ||
        (employmentType === 'individual' &&
         (employmentSubType === 'llp-partnership' || employmentSubType === 'private-limited'))) {
        return validateNonIndividualPersonalDetails();
    } else {
        return validateIndividualPersonalDetails();
    }
}

function validateIndividualPersonalDetails() {
    const address1 = document.getElementById('address1').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value;
    const pinCode = document.getElementById('pinCode').value.trim();
    const dob = document.getElementById('dob').value;
    const fatherName = document.getElementById('fatherName').value.trim();
    const aadharNumber = document.getElementById('aadharNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const gender = document.getElementById('gender').value;
    const existingCustomer = document.getElementById('existingCustomer').value;
    const cifNumber = document.getElementById('cifNumber').value.trim();
    const residenceType = document.getElementById('residenceType').value;
    const yearsAtResidence = document.getElementById('yearsAtResidence').value;

    let isValid = true;

    if (!address1) {
        showFieldError('address1', 'Please enter your address line 1');
        isValid = false;
    }

    if (!city) {
        showFieldError('city', 'Please enter your city');
        isValid = false;
    }

    if (!state) {
        showFieldError('state', 'Please select your state');
        isValid = false;
    }

    if (!pinCode || !validatePinCode(pinCode)) {
        showFieldError('pinCode', 'Please enter a valid 6-digit PIN code');
        isValid = false;
    }

    if (!dob) {
        showFieldError('dob', 'Please select your date of birth');
        isValid = false;
    }

    if (!fatherName) {
        showFieldError('fatherName', 'Please enter your father\'s name');
        isValid = false;
    }

    if (!aadharNumber || !validateAadhar(aadharNumber)) {
        showFieldError('aadharNumber', 'Please enter a valid 12-digit Aadhar number');
        isValid = false;
    }

    if (!email || !validateEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    if (!gender) {
        showFieldError('gender', 'Please select your gender');
        isValid = false;
    }

    if (!existingCustomer) {
        showFieldError('existingCustomer', 'Please specify if you are an existing customer');
        isValid = false;
    }

    if (existingCustomer === 'yes' && !cifNumber) {
        showFieldError('cifNumber', 'Please enter your CIF number');
        isValid = false;
    }

    if (!residenceType) {
        showFieldError('residenceType', 'Please select your residence type');
        isValid = false;
    }

    if (!yearsAtResidence || parseFloat(yearsAtResidence) < 0) {
        showFieldError('yearsAtResidence', 'Please enter valid years at current residence');
        isValid = false;
    }

    // Validate personal terms checkbox
    const agreePersonalTerms = document.getElementById('agreePersonalTerms');
    if (agreePersonalTerms && !agreePersonalTerms.checked) {
        showError('Please agree to the personal details terms and conditions to proceed');
        isValid = false;
    }

    return isValid;
}

function validateNonIndividualPersonalDetails() {
    const companyName = document.getElementById('companyName').value.trim();
    const companyAddress1 = document.getElementById('companyAddress1').value.trim();
    const companyCity = document.getElementById('companyCity').value.trim();
    const companyState = document.getElementById('companyState').value;
    const companyPinCode = document.getElementById('companyPinCode').value.trim();
    const gstNumber = document.getElementById('gstNumber').value.trim();
    const panNumberCompany = document.getElementById('panNumberCompany').value.trim();
    const cinLlpNumber = document.getElementById('cinLlpNumber').value.trim();
    const existingCustomerCompany = document.getElementById('existingCustomerCompany').value;
    const cifNumberCompany = document.getElementById('cifNumberCompany').value.trim();

    let isValid = true;

    if (!companyName) {
        showFieldError('companyName', 'Please enter company name');
        isValid = false;
    }

    if (!companyAddress1) {
        showFieldError('companyAddress1', 'Please enter company address line 1');
        isValid = false;
    }

    if (!companyCity) {
        showFieldError('companyCity', 'Please enter city');
        isValid = false;
    }

    if (!companyState) {
        showFieldError('companyState', 'Please select state');
        isValid = false;
    }

    if (!companyPinCode || !validatePinCode(companyPinCode)) {
        showFieldError('companyPinCode', 'Please enter a valid 6-digit PIN code');
        isValid = false;
    }

    if (!gstNumber || !validateGSTNumber(gstNumber)) {
        showFieldError('gstNumber', 'Please enter a valid GST number');
        isValid = false;
    }

    if (!panNumberCompany || !validatePAN(panNumberCompany)) {
        showFieldError('panNumberCompany', 'Please enter a valid PAN number');
        isValid = false;
    }

    if (!cinLlpNumber) {
        showFieldError('cinLlpNumber', 'Please enter CIN/LLP number');
        isValid = false;
    }

    // Check if at least one director/partner is filled
    const directorName1 = document.getElementById('directorName1').value.trim();
    const directorDin1 = document.getElementById('directorDin1').value.trim();
    
    if (!directorName1 || !directorDin1) {
        showFieldError('directorName1', 'Please enter at least one director/partner name and DIN/LLP number');
        isValid = false;
    }

    if (!existingCustomerCompany) {
        showFieldError('existingCustomerCompany', 'Please specify if existing customer');
        isValid = false;
    }

    if (existingCustomerCompany === 'yes' && !cifNumberCompany) {
        showFieldError('cifNumberCompany', 'Please enter CIF number');
        isValid = false;
    }

    // Validate personal terms checkbox for company
    const agreePersonalTermsCompany = document.getElementById('agreePersonalTermsCompany');
    if (agreePersonalTermsCompany && !agreePersonalTermsCompany.checked) {
        showError('Please agree to the personal details terms and conditions to proceed');
        isValid = false;
    }

    return isValid;
}

function validateIncomeDetails() {
    clearFieldErrors();

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        return validateNonIndividualIncomeDetails();
    } else {
        return validateIndividualIncomeDetails();
    }
}

function validateIndividualIncomeDetails() {
    const employerName = document.getElementById('employerName').value.trim();
    const grossMonthlyIncome = document.getElementById('grossMonthlyIncome').value;
    const totalMonthlyObligation = document.getElementById('totalMonthlyObligation').value;
    const yearsAtEmployer = document.getElementById('yearsAtEmployer').value;
    const officialEmailID = document.getElementById('officialEmailID').value.trim();

    let isValid = true;

    if (!employerName) {
        showFieldError('employerName', 'Please enter your employer name');
        isValid = false;
    }

    if (!grossMonthlyIncome || parseFloat(grossMonthlyIncome) <= 0) {
        showFieldError('grossMonthlyIncome', 'Please enter a valid gross monthly income');
        isValid = false;
    }

    if (!totalMonthlyObligation || parseFloat(totalMonthlyObligation) < 0) {
        showFieldError('totalMonthlyObligation', 'Please enter valid total monthly obligation');
        isValid = false;
    }

    if (!yearsAtEmployer || parseFloat(yearsAtEmployer) < 0) {
        showFieldError('yearsAtEmployer', 'Please enter valid years at current employer');
        isValid = false;
    }

    if (!officialEmailID || !validateEmail(officialEmailID)) {
        showFieldError('officialEmailID', 'Please enter a valid official email address');
        isValid = false;
    }

    return isValid;
}

function validateNonIndividualIncomeDetails() {
    const gstAnnualTurnover = document.getElementById('gstAnnualTurnover').value;
    const grossAnnualIncome = document.getElementById('grossAnnualIncome').value;
    const otherAnnualIncome = document.getElementById('otherAnnualIncome').value;
    const currentEMI = document.getElementById('currentEMI').value;
    const yearsInBusiness = document.getElementById('yearsInBusiness').value;

    let isValid = true;

    if (!gstAnnualTurnover || parseFloat(gstAnnualTurnover) <= 0) {
        showFieldError('gstAnnualTurnover', 'Please enter valid GST annual turnover');
        isValid = false;
    }

    if (!grossAnnualIncome || parseFloat(grossAnnualIncome) <= 0) {
        showFieldError('grossAnnualIncome', 'Please enter a valid gross annual income');
        isValid = false;
    }

    if (!currentEMI || parseFloat(currentEMI) < 0) {
        showFieldError('currentEMI', 'Please enter valid current EMI');
        isValid = false;
    }

    if (!yearsInBusiness || parseFloat(yearsInBusiness) < 0) {
        showFieldError('yearsInBusiness', 'Please enter valid years in business');
        isValid = false;
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.parentElement.classList.add('error');

        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();

        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentElement.appendChild(errorElement);
    }
}

function clearFieldErrors() {
    const errorFields = document.querySelectorAll('.form-group.error');
    errorFields.forEach(field => {
        field.classList.remove('error');
        const errorMessage = field.querySelector('.field-error');
        if (errorMessage) errorMessage.remove();
    });

    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}


// Data persistence functions
function saveFormData() {
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        if (input.type !== 'checkbox') {
            formData[input.id] = input.value;
        } else {
            formData[input.id] = input.checked;
        }
    });

    localStorage.setItem('loanApplicationData', JSON.stringify(formData));
}

function saveSelectionData() {
    const selections = {};
    const activeButtons = document.querySelectorAll('.selection-btn.active');
    activeButtons.forEach(button => {
        const group = button.closest('.selection-group');
        const label = group.querySelector('label').textContent.toLowerCase().replace(/\s+/g, '_');
        selections[label] = button.dataset.value;

        // Track employment sub-type
        if (label.includes('employment_sub_type')) {
            selectedEmploymentSubType = button.dataset.value;
        }
    });

    formData.selections = selections;
    localStorage.setItem('loanApplicationData', JSON.stringify(formData));
}

function loadSavedData() {
    const savedData = localStorage.getItem('loanApplicationData');
    if (savedData) {
        formData = JSON.parse(savedData);

        // Restore form values
        Object.keys(formData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type !== 'checkbox') {
                    element.value = formData[key];
                } else {
                    element.checked = formData[key];
                }
            }
        });

        // Restore selections
        if (formData.selections) {
            Object.keys(formData.selections).forEach(groupKey => {
                const value = formData.selections[groupKey];
                const button = document.querySelector(`[data-value="${value}"]`);
                if (button) {
                    const group = button.closest('.selection-group');
                    const buttons = group.querySelectorAll('.selection-btn');
                    buttons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Restore employment sub-type
                    if (groupKey.includes('employment_sub_type')) {
                        selectedEmploymentSubType = value;
                    }
                }
            });

            // Update employment sub-type and document visibility after restoring selections
            updateEmploymentSubTypeVisibility();
            updateDocumentVisibility();
        }
    }
}

// Utility functions
function resetApplication() {
    localStorage.removeItem('loanApplicationData');
    formData = {
        loanAmount: 1000000,
        interestRate: 8.5,
        tenure: 84
    };
    uploadedDocuments = {};
    currentStep = 0; // Start with loan selection
    updateStepDisplay();

    // Reset forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());

    // Reset selections
    const activeButtons = document.querySelectorAll('.selection-btn.active');
    activeButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Reset upload boxes
    const uploadBoxes = document.querySelectorAll('.upload-box');
    uploadBoxes.forEach(box => {
        box.classList.remove('uploaded');
        const statusElement = box.querySelector('.upload-status');
        if (statusElement) statusElement.textContent = '';
        const button = box.querySelector('.upload-btn');
        if (button) {
            button.textContent = 'Upload';
            button.style.backgroundColor = '#ff9800';
        }
    });
}

function showLoanSelection() {
    currentStep = 0;
    updateStepDisplay();
}

function showDocumentUpload() {
    if (currentStep < 5) {
        currentStep = 5;
        updateStepDisplay();
    }
}

function showFinalApproval() {
    currentStep = 6;
    updateStepDisplay();
}

// New popup-based document verification system
function showDocumentVerificationPopup(documentType, documentId) {
    // Close any existing verification modals first
    closeAllVerificationModals();
    
    let popupContent = '';

    switch(documentType) {
        case 'bankStatement':
            popupContent = `
                <div class="verification-popup">
                    <h3>📊 Bank Statement Verification</h3>
                    <div class="upload-section">
                        <div class="upload-area" id="upload-area-${documentId}">
                            <div class="upload-icon">📄</div>
                            <p>Drag & Drop your PDF here or</p>
                            <button type="button" class="upload-file-btn" onclick="selectFile('${documentId}')">Choose File</button>
                        </div>
                        <div class="upload-status" id="upload-status-${documentId}"></div>
                    </div>
                    <form class="verification-form" id="form-${documentId}">
                        <div class="form-group">
                            <label>Account Number *</label>
                            <input type="text" id="accountNumber-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Bank Name *</label>
                            <input type="text" id="bankName-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>IFSC Code *</label>
                            <input type="text" id="ifscCode-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Account Type *</label>
                            <select id="accountType-${documentId}" required>
                                <option value="">Select Account Type</option>
                                <option value="savings">Savings</option>
                                <option value="current">Current</option>
                                <option value="salary">Salary</option>
                            </select>
                        </div>
                    </form>
                </div>
            `;
            break;

        case 'gstDoc':
            popupContent = `
                <div class="verification-popup">
                    <h3>🏢 GST Certificate Verification</h3>
                    <div class="upload-section">
                        <div class="upload-area" id="upload-area-${documentId}">
                            <div class="upload-icon">📄</div>
                            <p>Drag & Drop your PDF here or</p>
                            <button type="button" class="upload-file-btn" onclick="selectFile('${documentId}')">Choose File</button>
                        </div>
                        <div class="upload-status" id="upload-status-${documentId}"></div>
                    </div>
                    <form class="verification-form" id="form-${documentId}">
                        <div class="form-group">
                            <label>GST Number *</label>
                            <input type="text" id="gstNumber-${documentId}" required placeholder="22AAAAA0000A1Z5">
                        </div>
                        <div class="form-group">
                            <label>Business Name *</label>
                            <input type="text" id="businessName-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Registration Date *</label>
                            <input type="date" id="registrationDate-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Business Type *</label>
                            <select id="businessType-${documentId}" required>
                                <option value="">Select Business Type</option>
                                <option value="proprietorship">Proprietorship</option>
                                <option value="partnership">Partnership</option>
                                <option value="private-limited">Private Limited</option>
                                <option value="public-limited">Public Limited</option>
                            </select>
                        </div>
                    </form>
                </div>
            `;
            break;

        case 'itrDoc':
            popupContent = `
                <div class="verification-popup">
                    <h3>📋 ITR Document Verification</h3>
                    <div class="itr-method-selection">
                        <h4>Choose verification method:</h4>
                        <div class="checkbox-options">
                            <label class="checkbox-option">
                                <input type="radio" name="itrMethod-${documentId}" value="fetch" onchange="toggleITRMethod('${documentId}', 'fetch')">
                                <span class="checkmark"></span>
                                Fetch from ITR Portal
                            </label>
                            <label class="checkbox-option">
                                <input type="radio" name="itrMethod-${documentId}" value="upload" onchange="toggleITRMethod('${documentId}', 'upload')">
                                <span class="checkmark"></span>
                                Upload PDF (3 months salary slip or 3 years ITR)
                            </label>
                        </div>
                    </div>
                    
                    <div class="itr-fetch-section" id="itr-fetch-${documentId}" style="display: none;">
                        <form class="verification-form">
                            <div class="form-group">
                                <label>Assessment Year *</label>
                                <input type="text" id="assessmentYear-${documentId}" required placeholder="e.g., 2023-24">
                            </div>
                            <div class="form-group">
                                <label>User ID *</label>
                                <input type="text" id="userId-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Password *</label>
                                <input type="password" id="password-${documentId}" required>
                            </div>
                        </form>
                    </div>
                    
                    <div class="itr-upload-section" id="itr-upload-${documentId}" style="display: none;">
                        <div class="upload-section">
                            <div class="upload-area" id="upload-area-${documentId}">
                                <div class="upload-icon">📄</div>
                                <p>Drag & Drop your PDF here or</p>
                                <button type="button" class="upload-file-btn" onclick="selectFile('${documentId}')">Choose File</button>
                            </div>
                            <div class="upload-status" id="upload-status-${documentId}"></div>
                        </div>
                        <form class="verification-form">
                            <div class="form-group">
                                <label>Assessment Year *</label>
                                <input type="text" id="assessmentYearUpload-${documentId}" required placeholder="e.g., 2023-24">
                            </div>
                            <div class="form-group">
                                <label>Gross Income *</label>
                                <input type="number" id="grossIncome-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Net Income *</label>
                                <input type="number" id="netIncome-${documentId}" required>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            break;

        case 'dealerInvoice':
            popupContent = `
                <div class="verification-popup">
                    <h3>🚗 Dealer Invoice Verification</h3>
                    <div class="car-type-selection">
                        <h4>Select Car Type:</h4>
                        <div class="checkbox-options">
                            <label class="checkbox-option">
                                <input type="radio" name="carType-${documentId}" id="preOwned-${documentId}" value="preOwned" onchange="handleCarTypeSelection('${documentId}', 'preOwned')">
                                <span class="checkmark"></span>
                                Pre-owned
                            </label>
                            <label class="checkbox-option">
                                <input type="radio" name="carType-${documentId}" id="newCar-${documentId}" value="newCar" onchange="handleCarTypeSelection('${documentId}', 'newCar')">
                                <span class="checkmark"></span>
                                New Car
                            </label>
                        </div>
                    </div>
                    
                    <div class="notification-message" id="preOwned-notification-${documentId}" style="display: none;">
                        <div class="info-box">
                            <span class="info-icon">ℹ️</span>
                            <p>For pre-owned cars, please contact your nearest branch for further assistance.</p>
                        </div>
                    </div>
                    
                    <div class="fuel-type-section" id="fuelType-section-${documentId}" style="display: none;">
                        <h4>Select Fuel Type:</h4>
                        <div class="checkbox-options">
                            <label class="checkbox-option">
                                <input type="radio" name="fuelType-${documentId}" value="petrol-diesel" onchange="handleFuelTypeSelection('${documentId}', 'petrol-diesel')">
                                <span class="checkmark"></span>
                                Petrol/Diesel
                            </label>
                            <label class="checkbox-option">
                                <input type="radio" name="fuelType-${documentId}" value="ev" onchange="handleFuelTypeSelection('${documentId}', 'ev')">
                                <span class="checkmark"></span>
                                EV (Electric Vehicle)
                            </label>
                        </div>
                    </div>
                    
                    <div class="document-upload-section" id="document-upload-${documentId}" style="display: none;">
                        <div class="upload-section">
                            <div class="upload-area" id="upload-area-${documentId}">
                                <div class="upload-icon">📄</div>
                                <p>Drag & Drop your PDF here or</p>
                                <button type="button" class="upload-file-btn" onclick="selectFile('${documentId}')">Choose File</button>
                            </div>
                            <div class="upload-status" id="upload-status-${documentId}"></div>
                        </div>
                        <form class="verification-form" id="form-${documentId}">
                            <div class="form-group">
                                <label>Car Model Name & Variant *</label>
                                <input type="text" id="carModelVariant-${documentId}" required placeholder="e.g., Maruti Suzuki Swift VXI">
                            </div>
                            <div class="form-group">
                                <label>Manufacturer Name *</label>
                                <input type="text" id="manufacturerName-${documentId}" required placeholder="e.g., Maruti Suzuki">
                            </div>
                            <div class="form-group">
                                <label>Authorized Dealer Name *</label>
                                <input type="text" id="dealerName-${documentId}" required placeholder="Dealer/Showroom name">
                            </div>
                            <div class="form-group">
                                <label>Dealer Address *</label>
                                <textarea id="dealerAddress-${documentId}" required placeholder="Complete dealer address" rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label>Is dealer in vicinity of borrower? *</label>
                                <select id="dealerVicinity-${documentId}" required>
                                    <option value="">Select</option>
                                    <option value="yes">Yes (Within 50km)</option>
                                    <option value="no">No (More than 50km)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Insurance from own source? *</label>
                                <select id="insuranceSource-${documentId}" required>
                                    <option value="">Select</option>
                                    <option value="own">Own Source</option>
                                    <option value="dealer">Through Dealer</option>
                                    <option value="bank">Through Bank</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Down Payment Amount *</label>
                                <input type="number" id="downPayment-${documentId}" required placeholder="Enter down payment amount">
                            </div>
                            <div class="form-group">
                                <label>Invoice Date *</label>
                                <input type="date" id="invoiceDate-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Ex-showroom Cost *</label>
                                <input type="number" id="exShowroomCost-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Registration *</label>
                                <input type="number" id="registration-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Insurance *</label>
                                <input type="number" id="insurance-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Discount *</label>
                                <input type="number" id="discount-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Exchange Amount *</label>
                                <input type="number" id="exchangeAmount-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Accessories & Others *</label>
                                <input type="number" id="accessories-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Other Taxes/GST & Others *</label>
                                <input type="number" id="otherTaxes-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Installation Fee *</label>
                                <input type="number" id="installationFee-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Total Invoice Value *</label>
                                <input type="number" id="totalInvoiceValue-${documentId}" required>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            break;
    }

    const modal = document.createElement('div');
    modal.className = 'verification-modal';
    modal.id = `verification-modal-${documentId}`;
    modal.innerHTML = `
        <div class="verification-modal-content">
            <span class="close-verification" onclick="closeVerificationPopup('${documentId}')">&times;</span>
            ${popupContent}
            <div class="verification-actions">
                <button type="button" class="cancel-verification-btn" onclick="closeVerificationPopup('${documentId}')">Cancel</button>
                <button type="button" class="verify-document-btn" onclick="verifyDocument('${documentId}', '${documentType}')">Verify</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Add drag and drop functionality
    setupDragAndDrop(documentId);
}

// Handler functions for dealer invoice
function handleCarTypeSelection(documentId, carType) {
    if (!documentId || !carType) {
        console.error('Invalid parameters for car type selection');
        return;
    }

    const preOwnedCheckbox = document.getElementById(`preOwned-${documentId}`);
    const newCarCheckbox = document.getElementById(`newCar-${documentId}`);
    const preOwnedNotification = document.getElementById(`preOwned-notification-${documentId}`);
    const fuelTypeSection = document.getElementById(`fuelType-section-${documentId}`);
    const documentUploadSection = document.getElementById(`document-upload-${documentId}`);
    
    // Add null checks
    if (!preOwnedCheckbox || !newCarCheckbox || !preOwnedNotification || !fuelTypeSection || !documentUploadSection) {
        console.error('Required elements not found for car type selection:', {
            preOwned: !!preOwnedCheckbox,
            newCar: !!newCarCheckbox,
            notification: !!preOwnedNotification,
            fuelSection: !!fuelTypeSection,
            uploadSection: !!documentUploadSection
        });
        return;
    }
    
    // Ensure only one checkbox is selected (radio button behavior)
    if (carType === 'preOwned') {
        preOwnedCheckbox.checked = true;
        newCarCheckbox.checked = false;
        preOwnedNotification.style.display = 'block';
        fuelTypeSection.style.display = 'none';
        documentUploadSection.style.display = 'none';
        
        // Clear fuel type selection when switching to pre-owned
        clearFuelTypeSelection(documentId);
    } else if (carType === 'newCar') {
        preOwnedCheckbox.checked = false;
        newCarCheckbox.checked = true;
        preOwnedNotification.style.display = 'none';
        fuelTypeSection.style.display = 'block';
        documentUploadSection.style.display = 'none';
        
        // Clear fuel type selection when switching to new car
        clearFuelTypeSelection(documentId);
    }
}

function handleFuelTypeSelection(documentId, fuelType) {
    if (!documentId || !fuelType) {
        console.error('Invalid parameters for fuel type selection');
        return;
    }

    const documentUploadSection = document.getElementById(`document-upload-${documentId}`);
    
    // Add null check
    if (!documentUploadSection) {
        console.error('Document upload section not found for ID:', documentId);
        return;
    }
    
    documentUploadSection.style.display = 'block';
}

function clearFuelTypeSelection(documentId) {
    const petrolDieselRadio = document.querySelector(`input[name="fuelType-${documentId}"][value="petrol-diesel"]`);
    const evRadio = document.querySelector(`input[name="fuelType-${documentId}"][value="ev"]`);
    
    if (petrolDieselRadio) petrolDieselRadio.checked = false;
    if (evRadio) evRadio.checked = false;
}

// Handler function for ITR method selection
function toggleITRMethod(documentId, method) {
    if (!documentId || !method) {
        console.error('Invalid parameters for ITR method toggle');
        return;
    }

    const fetchSection = document.getElementById(`itr-fetch-${documentId}`);
    const uploadSection = document.getElementById(`itr-upload-${documentId}`);
    
    // Add null checks
    if (!fetchSection || !uploadSection) {
        console.error('ITR method sections not found for ID:', documentId);
        return;
    }
    
    if (method === 'fetch') {
        fetchSection.style.display = 'block';
        uploadSection.style.display = 'none';
    } else if (method === 'upload') {
        fetchSection.style.display = 'none';
        uploadSection.style.display = 'block';
    }
}

function setupDragAndDrop(documentId) {
    if (!documentId) {
        console.error('Invalid document ID for drag and drop setup');
        return;
    }

    const uploadArea = document.getElementById(`upload-area-${documentId}`);
    
    if (!uploadArea) {
        console.error('Upload area not found for ID:', documentId);
        return;
    }

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0], documentId);
        }
    });
}

function selectFile(documentId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            handleFileSelection(file, documentId);
        }
    };
    input.click();
}

function handleFileSelection(file, documentId) {
    if (!file || !documentId) {
        console.error('Invalid file or document ID');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('File size should not exceed 5MB');
        return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
        showError('Please upload a PDF file only');
        return;
    }

    const uploadStatus = document.getElementById(`upload-status-${documentId}`);
    if (!uploadStatus) {
        console.error('Upload status element not found for ID:', documentId);
        return;
    }

    uploadStatus.innerHTML = `
        <div class="file-uploaded">
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        </div>
    `;

    // Store file for later processing
    window.tempUploadedFiles = window.tempUploadedFiles || {};
    window.tempUploadedFiles[documentId] = file;
}

function verifyDocument(documentId, documentType) {
    // Special validation for dealer invoice
    if (documentType === 'dealerInvoice') {
        const preOwnedSelected = document.getElementById(`preOwned-${documentId}`)?.checked;
        const newCarSelected = document.getElementById(`newCar-${documentId}`)?.checked;
        
        if (!preOwnedSelected && !newCarSelected) {
            showError('Please select a car type (Pre-owned or New Car)');
            return;
        }
        
        if (preOwnedSelected) {
            // For pre-owned cars, just show notification - no further processing needed
            showSuccess('For pre-owned cars, please contact your nearest branch for further assistance.');
            closeVerificationPopup(documentId);
            return;
        }
        
        if (newCarSelected) {
            const petrolDieselSelected = document.querySelector(`input[name="fuelType-${documentId}"][value="petrol-diesel"]`)?.checked;
            const evSelected = document.querySelector(`input[name="fuelType-${documentId}"][value="ev"]`)?.checked;
            
            if (!petrolDieselSelected && !evSelected) {
                showError('Please select a fuel type');
                return;
            }
            
            // Check if PDF is uploaded and form is filled for new car
            const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
            if (!file) {
                showError('Please upload a PDF file first');
                return;
            }
            
            const form = document.getElementById(`form-${documentId}`);
            if (form) {
                const requiredFields = form.querySelectorAll('[required]');
                let isValid = true;

                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        field.style.borderColor = '#dc3545';
                        isValid = false;
                    } else {
                        field.style.borderColor = '#ddd';
                    }
                });

                if (!isValid) {
                    showError('Please fill all required fields');
                    return;
                }
            }
        }
    }
    
    // Special validation for ITR
    if (documentType === 'itrDoc') {
        const fetchSelected = document.querySelector(`input[name="itrMethod-${documentId}"][value="fetch"]`)?.checked;
        const uploadSelected = document.querySelector(`input[name="itrMethod-${documentId}"][value="upload"]`)?.checked;
        
        if (!fetchSelected && !uploadSelected) {
            showError('Please select a verification method');
            return;
        }
        
        if (fetchSelected) {
            const assessmentYear = document.getElementById(`assessmentYear-${documentId}`)?.value;
            const userId = document.getElementById(`userId-${documentId}`)?.value;
            const password = document.getElementById(`password-${documentId}`)?.value;
            
            if (!assessmentYear || !userId || !password) {
                showError('Please fill Assessment Year, User ID and Password for fetching ITR data');
                return;
            }
        }
        
        if (uploadSelected) {
            const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
            if (!file) {
                showError('Please upload a PDF file first');
                return;
            }
            
            const assessmentYearUpload = document.getElementById(`assessmentYearUpload-${documentId}`)?.value;
            const grossIncome = document.getElementById(`grossIncome-${documentId}`)?.value;
            const netIncome = document.getElementById(`netIncome-${documentId}`)?.value;
            
            if (!assessmentYearUpload || !grossIncome || !netIncome) {
                showError('Please fill Assessment Year, gross income and net income');
                return;
            }
        }
    }

    // Validation for bank statement
    if (documentType === 'bankStatement') {
        const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
        if (!file) {
            showError('Please upload a PDF file first');
            return;
        }
        
        const form = document.getElementById(`form-${documentId}`);
        if (form) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    field.style.borderColor = '#ddd';
                }
            });

            if (!isValid) {
                showError('Please fill all required fields');
                return;
            }
        }
    }

    // Validation for GST document
    if (documentType === 'gstDoc') {
        const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
        if (!file) {
            showError('Please upload a PDF file first');
            return;
        }
        
        const form = document.getElementById(`form-${documentId}`);
        if (form) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    field.style.borderColor = '#ddd';
                }
            });

            if (!isValid) {
                showError('Please fill all required fields');
                return;
            }
        }
    }

    // Show loading
    showLoading();

    // Simulate verification process
    setTimeout(() => {
        hideLoading();

        // Generate verification ID
        const verificationId = generateVerificationId(documentType);

        // Get file reference
        const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
        
        // For ITR fetch method, create a dummy file object
        let fileData = file;
        if (documentType === 'itrDoc') {
            const fetchSelected = document.querySelector(`input[name="itrMethod-${documentId}"][value="fetch"]`)?.checked;
            if (fetchSelected && !file) {
                fileData = {
                    name: 'ITR_Fetched_Data.pdf',
                    size: 1024,
                    type: 'application/pdf'
                };
            }
        }

        // Store document data
        let fileURL = null;
        if (fileData && fileData instanceof File) {
            try {
                fileURL = URL.createObjectURL(fileData);
            } catch (error) {
                console.error('Error creating object URL:', error);
                fileURL = null;
            }
        }

        uploadedDocuments[documentId] = {
            name: fileData ? fileData.name : 'Document.pdf',
            size: fileData ? fileData.size : 1024,
            type: fileData ? fileData.type : 'application/pdf',
            uploadDate: new Date(),
            fileURL: fileURL,
            file: fileData,
            verified: true,
            verificationId: verificationId,
            documentType: documentType
        };

        // Update UI
        updateDocumentStatus(documentId, documentType, verificationId);

        // Close popup
        closeVerificationPopup(documentId);

        // Check if all documents are uploaded
        checkAllDocumentsUploaded();

        showSuccess(`${getDocumentDisplayName(documentType)} verified successfully! ID: ${verificationId}`);
    }, 2000);
}

function generateVerificationId(documentType) {
    const prefix = {
        'bankStatement': 'BS',
        'gstDoc': 'GST',
        'itrDoc': 'ITR',
        'dealerInvoice': 'DI'
    };

    const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix[documentType]}${randomNumber}`;
}

function getDocumentDisplayName(documentType) {
    const names = {
        'bankStatement': 'Bank Statement',
        'gstDoc': 'GST Certificate',
        'itrDoc': 'ITR Document',
        'dealerInvoice': 'Dealer Invoice'
    };
    return names[documentType] || 'Document';
}

function updateDocumentStatus(documentId, documentType, verificationId) {
    const uploadBox = document.getElementById(documentId);
    uploadBox.classList.add('uploaded');

    const uploadBtn = uploadBox.querySelector('.upload-btn');
    uploadBtn.textContent = '✓ Verified';
    uploadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
    uploadBtn.style.color = 'white';
    uploadBtn.style.border = 'none';
    uploadBtn.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
    uploadBtn.disabled = true;

    const statusElement = uploadBox.querySelector('.upload-status');
    statusElement.innerHTML = `
        <div class="verification-success">
            <div class="success-info">
                <span class="success-check">✅</span>
                <span class="verification-id">ID: ${verificationId}</span>
            </div>
            <div class="document-actions">
                <button class="view-document-btn" onclick="viewUploadedDocument('${documentId}')">
                    👁️ View
                </button>
            </div>
        </div>
    `;
}

function viewUploadedDocument(documentId) {
    const document = uploadedDocuments[documentId];
    if (!document || !document.fileURL) {
        showError('Document not found');
        return;
    }

    showDocumentPreview(documentId);
}

function closeVerificationPopup(documentId) {
    const modal = document.getElementById(`verification-modal-${documentId}`);
    if (modal) {
        modal.remove();
    }

    // Clean up temp files
    if (window.tempUploadedFiles && window.tempUploadedFiles[documentId]) {
        delete window.tempUploadedFiles[documentId];
    }
}

function closeAllVerificationModals() {
    // Close all verification modals
    const existingModals = document.querySelectorAll('.verification-modal');
    existingModals.forEach(modal => modal.remove());
    
    // Clean up all temp files
    if (window.tempUploadedFiles) {
        window.tempUploadedFiles = {};
    }
}

function processFileUpload(file, documentId, uploadType, buttonElement) {
    showLoading();

    // Create file URL for preview
    let fileURL = null;
    try {
        if (file instanceof File) {
            fileURL = URL.createObjectURL(file);
        }
    } catch (error) {
        console.error('Error creating object URL:', error);
        fileURL = null;
    }

    // Simulate upload process
    setTimeout(() => {
        hideLoading();

        // Mark as uploaded with file URL for preview
        uploadedDocuments[documentId] = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date(),
            fileURL: fileURL,
            file: file
        };

        // Update UI
        const uploadBox = document.getElementById(documentId);
        uploadBox.classList.add('uploaded');

        const statusElement = uploadBox.querySelector('.upload-status');
        statusElement.innerHTML = `
            <div class="upload-success">
                <span class="success-check">✓</span>
                <span class="file-name">${file.name}</span>
                <button class="preview-btn" onclick="showDocumentPreview('${documentId}')">
                    👁️ Preview
                </button>
            </div>
        `;

        // Add verification buttons for different documents
        if (documentId === 'bankStatement') {
            statusElement.innerHTML += `
                <button class="verify-bank-btn" onclick="showBankVerificationModal()">
                    Verify Bank Account
                </button>
            `;
        } else if (documentId === 'dealerInvoice') {
            statusElement.innerHTML += `
                <button class="verify-dealer-btn" onclick="showDealerVerificationModal()">
                    Verify Dealer Invoice
                </button>
            `;
        } else if (documentId === 'gstDoc') {
            statusElement.innerHTML += `
                <button class="verify-gst-btn" onclick="showGSTVerificationModal()">
                    Verify GST
                </button>
            `;
        } else if (documentId === 'itrDoc') {
            statusElement.innerHTML += `
                <button class="verify-itr-btn" onclick="showITRVerificationModal()">
                    Verify ITR
                </button>
            `;
        }

        if (buttonElement) {
            buttonElement.textContent = 'Re-upload';
            buttonElement.style.backgroundColor = '#28a745';
        }

        // Check if all documents are uploaded
        checkAllDocumentsUploaded();

        showSuccess(`${uploadType} uploaded successfully!`);
    }, 1500);
}

function checkAllDocumentsUploaded() {
    let requiredDocs = ['bankStatement', 'itrDoc']; // Always required for both individual and non-individual
    
    // Get selected loan type and employment type
    const activeLoanType = document.querySelector('.selection-btn.active[data-value]')?.dataset.value || formData.selections?.loan_type;
    const employmentType = formData.employmentType || 'individual';
    
    if (employmentType === 'individual') {
        // INDIVIDUAL LOGIC:
        if (activeLoanType === 'vehicle') {
            // Vehicle loan (2wheeler or 4wheeler): ITR, bank statement, dealer invoice (NO GST)
            requiredDocs.push('dealerInvoice');
        }
        // For home, personal, education loans: only ITR and bank statement required (NO dealer invoice, NO GST)
    } else if (employmentType === 'non-individual') {
        // NON-INDIVIDUAL LOGIC:
        requiredDocs.push('gstDoc'); // GST always required for non-individual
        
        if (activeLoanType === 'vehicle') {
            // Vehicle loan (2wheeler or 4wheeler): ALL 4 documents (GST, bank statement, ITR, dealer invoice)
            requiredDocs.push('dealerInvoice');
        }
        // For home, personal, education loans: GST, bank statement, ITR (NO dealer invoice)
    }

    const allUploaded = requiredDocs.every(docId => uploadedDocuments[docId] && uploadedDocuments[docId].verified);

    const proceedButton = document.getElementById('proceedToApproval');
    if (proceedButton) {
        if (allUploaded) {
            proceedButton.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            proceedButton.style.color = 'white';
            proceedButton.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
            proceedButton.textContent = '✓ All Documents Verified - Proceed';
        } else {
            const missingCount = requiredDocs.filter(docId => !uploadedDocuments[docId] || !uploadedDocuments[docId].verified).length;
            proceedButton.style.background = 'linear-gradient(135deg, #f44336, #d32f2f)';
            proceedButton.style.color = 'white';
            proceedButton.style.boxShadow = '0 4px 12px rgba(244, 67, 54, 0.3)';
            proceedButton.textContent = `Verify ${missingCount} more documents`;
        }
    }
}

// Setup upload handlers
function setupUploadHandlers() {
    const uploadButtons = document.querySelectorAll('.upload-btn');
    uploadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const uploadBox = this.closest('.upload-box');
            const uploadType = uploadBox.querySelector('h3').textContent;
            const documentId = uploadBox.id;
            handleDocumentUpload(documentId); // Changed to call handleDocumentUpload
        });
    });
}

// Update income form visibility based on employment type
function updateIncomeFormVisibility() {
    const individualForm = document.getElementById('individual-income-form');
    const nonIndividualForm = document.getElementById('non-individual-income-form');

    if (!individualForm || !nonIndividualForm) return;

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        individualForm.style.display = 'none';
        nonIndividualForm.style.display = 'block';

        // Clear required attributes from individual form
        const individualInputs = individualForm.querySelectorAll('input[required], select[required]');
        individualInputs.forEach(input => input.removeAttribute('required'));

        // Add required attributes to non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input, select');
        nonIndividualInputs.forEach(input => {
            if (input.id !== 'otherAnnualIncome' && input.type !== 'readonly') {
                input.setAttribute('required', 'required');
            }
        });
    } else {
        individualForm.style.display = 'block';
        nonIndividualForm.style.display = 'none';

        // Add required attributes to individual form
        const individualInputs = individualForm.querySelectorAll('input, select');
        individualInputs.forEach(input => {
            if (input.type !== 'readonly' && input.id !== 'bonusOvertimeArrear') {
                input.setAttribute('required', 'required');
            }
        });

        // Clear required attributes from non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input[required], select[required]');
        nonIndividualInputs.forEach(input => input.removeAttribute('required'));
    }
}

// Update basic form visibility based on employment type
function updateBasicFormVisibility() {
    const individualForm = document.getElementById('individual-basic-form');
    const nonIndividualForm = document.getElementById('non-individual-basic-form');

    if (!individualForm || !nonIndividualForm) return;

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        individualForm.style.display = 'none';
        nonIndividualForm.style.display = 'block';

        // Clear required attributes from individual form
        const individualInputs = individualForm.querySelectorAll('input[required], select[required]');
        individualInputs.forEach(input => input.removeAttribute('required'));

        // Add required attributes to non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input, select');
        nonIndividualInputs.forEach(input => {
            input.setAttribute('required', 'required');
        });
    } else {
        individualForm.style.display = 'block';
        nonIndividualForm.style.display = 'none';

        // Add required attributes to individual form
        const individualInputs = individualForm.querySelectorAll('input, select');
        individualInputs.forEach(input => {
            input.setAttribute('required', 'required');
        });

        // Clear required attributes from non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input[required], select[required]');
        nonIndividualInputs.forEach(input => input.removeAttribute('required'));
    }
}

// Update personal form visibility based on employment type
function updatePersonalFormVisibility() {
    const individualForm = document.querySelector('#step-2 .form-container:not(#non-individual-personal-form)');
    const nonIndividualForm = document.getElementById('non-individual-personal-form');

    if (!individualForm || !nonIndividualForm) return;

    const employmentType = formData.employmentType || 'individual';
    const employmentSubType = formData.employmentSubType || 'salaried';

    // Show non-individual form for:
    // 1. Non-individual employment type
    // 2. Individual with LLP/Partnership or Private Limited sub-types
    if (employmentType === 'non-individual' || 
        (employmentType === 'individual' && 
         (employmentSubType === 'llp-partnership' || employmentSubType === 'private-limited'))) {
        individualForm.style.display = 'none';
        nonIndividualForm.style.display = 'block';

        // Clear required attributes from individual form
        const individualInputs = individualForm.querySelectorAll('input[required], select[required], textarea[required]');
        individualInputs.forEach(input => input.removeAttribute('required'));

        // Add required attributes to non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input, select, textarea');
        nonIndividualInputs.forEach(input => {
            if (input.id !== 'cifNumberCompany' && input.id !== 'bureauScoreCompany' && input.id !== 'companyAddress2') {
                input.setAttribute('required', 'required');
            }
        });
    } else {
        // Show individual form for:
        // 1. Individual employment type (except LLP/Partnership and Private Limited)
        // 2. NRI employment type
        individualForm.style.display = 'block';
        nonIndividualForm.style.display = 'none';

        // Add required attributes to individual form
        const individualInputs = individualForm.querySelectorAll('input, select, textarea');
        individualInputs.forEach(input => {
            if (input.id !== 'cifNumber' && input.id !== 'bureauScore' && input.id !== 'address2') {
                input.setAttribute('required', 'required');
            }
        });

        // Clear required attributes from non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input[required], select[required], textarea[required]');
        nonIndividualInputs.forEach(input => input.removeAttribute('required'));
    }
}

// Update employment sub-type visibility based on employment type
function updateEmploymentSubTypeVisibility() {
    const employmentType = formData.employmentType || 'individual';
    const employmentSubTypeButtons = document.querySelectorAll('.employment-sub-type-btn');

    employmentSubTypeButtons.forEach(button => {
        const buttonValue = button.dataset.value;

        if (employmentType === 'non-individual') {
            // For non-individual, only show LLP/Partnership and Private Limited
            if (buttonValue === 'llp-partnership' || buttonValue === 'private-limited') {
                button.style.display = 'block';
            } else {
                button.style.display = 'none';
                // Remove active class if hidden button was active
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                }
            }
        } else if (employmentType === 'individual') {
            // For individual, show all except LLP/Partnership and Private Limited
            if (buttonValue === 'llp-partnership' || buttonValue === 'private-limited') {
                button.style.display = 'none';
                // Remove active class if hidden button was active
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                }
            } else {
                button.style.display = 'block';
            }
        } else if (employmentType === 'nri') {
            // For NRI, show only salaried and self-employed
            if (buttonValue === 'salaried' || buttonValue === 'self-employed') {
                button.style.display = 'block';
            } else {
                button.style.display = 'none';
                // Remove active class if hidden button was active
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                }
            }
        }
    });

    // If no employment sub-type is selected after filtering, select the first visible one
    const activeSubType = document.querySelector('.employment-sub-type-btn.active:not([style*="none"])');
    if (!activeSubType) {
        const firstVisible = document.querySelector('.employment-sub-type-btn:not([style*="none"])');
        if (firstVisible && firstVisible.style.display !== 'none') {
            firstVisible.classList.add('active');
            selectedEmploymentSubType = firstVisible.dataset.value;
            formData.employmentSubType = firstVisible.dataset.value;
        }
    }

    // Update form visibility and document visibility
    updateBasicFormVisibility();
    updatePersonalFormVisibility();
    updateIncomeFormVisibility();
    updateDocumentVisibility();
}

// Update document visibility based on loan type and employment type
function updateDocumentVisibility() {
    const gstDocument = document.getElementById('gstDocument');
    const dealerInvoiceDocument = document.getElementById('dealerInvoice')?.closest('.upload-item');
    
    // Get selected loan type from formData or active selection
    const activeLoanType = document.querySelector('.selection-btn.active[data-value]')?.dataset.value || formData.selections?.loan_type;
    const employmentType = formData.employmentType || 'individual';
    const employmentSubType = formData.employmentSubType || 'salaried';
    
    // Hide all optional documents by default
    if (gstDocument) gstDocument.style.display = 'none';
    if (dealerInvoiceDocument) dealerInvoiceDocument.style.display = 'none';
    
    // Determine if this should be treated as non-individual for document purposes
    const isNonIndividualForDocs = employmentType === 'non-individual' || 
        (employmentType === 'individual' && 
         (employmentSubType === 'llp-partnership' || employmentSubType === 'private-limited'));
    
    if (isNonIndividualForDocs) {
        // NON-INDIVIDUAL LOGIC (including LLP/Partnership and Private Limited individuals):
        if (activeLoanType === 'vehicle') {
            // Vehicle loan (2wheeler or 4wheeler): Show ALL 4 documents (GST, bank statement, ITR, dealer invoice)
            if (gstDocument) gstDocument.style.display = 'block';
            if (dealerInvoiceDocument) dealerInvoiceDocument.style.display = 'block';
        } else if (activeLoanType === 'home' || activeLoanType === 'personal' || activeLoanType === 'education') {
            // Home/Personal/Education loans: Show GST, bank statement, ITR (NO dealer invoice)
            if (gstDocument) gstDocument.style.display = 'block';
            if (dealerInvoiceDocument) dealerInvoiceDocument.style.display = 'none';
        }
    } else {
        // INDIVIDUAL LOGIC (including NRI):
        if (activeLoanType === 'vehicle') {
            // Vehicle loan (2wheeler or 4wheeler): Show dealer invoice, bank statement, ITR (NO GST)
            if (dealerInvoiceDocument) dealerInvoiceDocument.style.display = 'block';
            if (gstDocument) gstDocument.style.display = 'none';
        } else if (activeLoanType === 'home' || activeLoanType === 'personal' || activeLoanType === 'education') {
            // Home/Personal/Education loans: Show only bank statement, ITR (NO dealer invoice, NO GST)
            if (dealerInvoiceDocument) dealerInvoiceDocument.style.display = 'none';
            if (gstDocument) gstDocument.style.display = 'none';
        }
    }

    // Update required documents check
    checkAllDocumentsUploaded();
}

// Call setup on DOM load
document.addEventListener('DOMContentLoaded', setupUploadHandlers);

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' && activeElement.type !== 'checkbox') {
            event.preventDefault();
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn && nextBtn.style.display !== 'none') {
                nextBtn.click();
            }
        }
    }
});

// Demo functions for testing
function simulateSteps() {
    // Fill demo data
    document.getElementById('fullName').value = 'John Doe';
    document.getElementById('mobile').value = '9876543210';
    document.getElementById('loanAmount').value = '500000';
    document.getElementById('panNumber').value = 'ABCDE1234F';
    document.getElementById('agreeOVD').checked = true;

    saveFormData();
    alert('Demo data filled. You can now navigate through the steps.');
}

// Number formatting function
function formatNumberWithCommas(num) {
    // Handle both string and number inputs
    const str = num.toString();
    
    // Split on decimal point to handle decimals properly
    const parts = str.split('.');
    
    // Format the integer part with commas
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Rejoin with decimal point if there was one
    return parts.join('.');
}

function removeCommas(str) {
    if (!str || typeof str !== 'string') {
        return '0';
    }
    return str.replace(/,/g, '').trim();
}

// Setup number formatting for loan amount and income fields
function setupNumberFormatting() {
    const numberInputs = [
        'loanAmount', 'businessLoanAmount', 'grossMonthlyIncome', 'bonusOvertimeArrear',
        'totalMonthlyObligation', 'gstAnnualTurnover', 'grossAnnualIncome', 
        'otherAnnualIncome', 'currentEMI'
    ];

    numberInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            // Allow only numbers, commas, and decimal points during input
            input.addEventListener('keypress', function(e) {
                const char = String.fromCharCode(e.which);
                const currentValue = e.target.value;
                
                // Allow digits, decimal point (only one), and backspace/delete
                if (!/[0-9.]/.test(char) && e.which !== 8 && e.which !== 46) {
                    e.preventDefault();
                    return;
                }
                
                // Prevent multiple decimal points
                if (char === '.' && currentValue.includes('.')) {
                    e.preventDefault();
                    return;
                }
            });

            input.addEventListener('input', function(e) {
                let value = removeCommas(e.target.value);
                
                // Remove any non-numeric characters except decimal point
                value = value.replace(/[^0-9.]/g, '');
                
                // Ensure only one decimal point
                const parts = value.split('.');
                if (parts.length > 2) {
                    value = parts[0] + '.' + parts.slice(1).join('');
                }
                
                if (value !== '' && !isNaN(value)) {
                    e.target.value = formatNumberWithCommas(value);
                } else if (value === '') {
                    e.target.value = '';
                }
            });

            input.addEventListener('blur', function(e) {
                let value = removeCommas(e.target.value);
                if (!isNaN(value) && value !== '') {
                    // Format the number properly on blur
                    const numValue = parseFloat(value);
                    e.target.value = formatNumberWithCommas(numValue.toString());
                }
            });
        }
    });
}

// Auto-calculation setup
function setupAutoCalculations() {
    // Individual form calculations
    const grossIncomeInput = document.getElementById('grossMonthlyIncome');
    const bonusInput = document.getElementById('bonusOvertimeArrear');
    const totalIncomeInput = document.getElementById('totalIncome');
    const obligationInput = document.getElementById('totalMonthlyObligation');
    const netSalaryInput = document.getElementById('netMonthlySalary');

    function calculateTotals() {
        const grossIncome = parseFloat(removeCommas(grossIncomeInput?.value || '0'));
        const bonus = parseFloat(removeCommas(bonusInput?.value || '0'));
        const obligation = parseFloat(removeCommas(obligationInput?.value || '0'));

        const totalIncome = grossIncome - bonus;
        const netSalary = totalIncome - obligation;

        if (totalIncomeInput) totalIncomeInput.value = formatNumberWithCommas(totalIncome.toFixed(2));
        if (netSalaryInput) netSalaryInput.value = formatNumberWithCommas(netSalary.toFixed(2));
    }

    [grossIncomeInput, bonusInput, obligationInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateTotals);
            input.addEventListener('change', calculateTotals);
        }
    });

    // Non-individual form calculations
    const grossAnnualInput = document.getElementById('grossAnnualIncome');
    const otherAnnualInput = document.getElementById('otherAnnualIncome');
    const netAnnualInput = document.getElementById('netAnnualIncome');

    function calculateAnnualTotals() {
        const grossAnnual = parseFloat(removeCommas(grossAnnualInput?.value || '0'));
        const otherAnnual = parseFloat(removeCommas(otherAnnualInput?.value || '0'));

        const netAnnual = grossAnnual + otherAnnual;

        if (netAnnualInput) netAnnualInput.value = formatNumberWithCommas(netAnnual.toFixed(2));
    }

    [grossAnnualInput, otherAnnualInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateAnnualTotals);
            input.addEventListener('change', calculateAnnualTotals);
        }
    });
}

// Tenure slider setup
function setupTenureSlider() {
    const slider = document.getElementById('tenureSlider');
    const display = document.getElementById('tenureDisplay');
    const emiDisplay = document.getElementById('dynamicEMI');

    if (slider && display) {
        slider.addEventListener('input', function() {
            const tenure = parseInt(this.value);
            display.textContent = tenure;
            formData.tenure = tenure;
            calculateEMI();
        });
    }
}

// EMI Calculation
function calculateEMI() {
    // Get loan amount from form data or current input fields
    let principal = formData.loanAmount;
    
    // If no loan amount in formData, try to get it from current input
    if (!principal || isNaN(principal)) {
        const employmentType = formData.employmentType || 'individual';
        const loanAmountField = employmentType === 'non-individual' ? 
            document.getElementById('businessLoanAmount') : 
            document.getElementById('loanAmount');
            
        if (loanAmountField && loanAmountField.value) {
            const rawValue = removeCommas(loanAmountField.value.trim());
            principal = parseFloat(rawValue);
        }
    }
    
    // Fallback to default if still invalid
    if (!principal || isNaN(principal) || principal <= 0) {
        principal = 1000000; // Default 10 lakhs
        formData.loanAmount = principal;
    }
    
    const rate = (formData.interestRate || 8.5) / 100 / 12;
    const tenure = formData.tenure || 84;

    const emi = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);

    const emiDisplay = document.getElementById('dynamicEMI');
    if (emiDisplay) {
        // Add validation to ensure EMI is a valid number
        if (!isNaN(emi) && isFinite(emi)) {
            emiDisplay.textContent = `Rs. ${Math.round(emi).toLocaleString('en-IN')} p.m.`;
        } else {
            emiDisplay.textContent = `Rs. ${Math.round(principal * 0.015).toLocaleString('en-IN')} p.m.`; // Fallback calculation
        }
    }

    // Update other displays
    const loanAmountDisplay = document.getElementById('displayLoanAmount');
    const interestRateDisplay = document.getElementById('displayInterestRate');

    if (loanAmountDisplay) {
        if (!isNaN(principal) && isFinite(principal)) {
            loanAmountDisplay.textContent = `${(principal / 100000).toFixed(1)} Lakhs`;
        } else {
            loanAmountDisplay.textContent = `10.0 Lakhs`; // Fallback
        }
    }

    if (interestRateDisplay) {
        interestRateDisplay.textContent = formData.interestRate || '8.50';
    }
}

// Enhanced validation functions
function validateMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
}

function validatePAN(pan) {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

function validateAadhar(aadhar) {
    return /^\d{12}$/.test(aadhar.replace(/\s/g, ''));
}

function validatePassport(passport) {
    return /^[A-Z]{1}[0-9]{7}$/.test(passport);
}

function validateDrivingLicense(dl) {
    return /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/.test(dl.replace(/\s/g, ''));
}

function validateVoterID(voterId) {
    return /^[A-Z]{3}[0-9]{7}$/.test(voterId);
}

// OVD Verification Functions
function handleOVDTypeChange() {
    const ovdType = document.getElementById('ovdType').value;
    const ovdNumberGroup = document.getElementById('ovdNumberGroup');
    const ovdNumberLabel = document.getElementById('ovdNumberLabel');
    const ovdNumberInput = document.getElementById('ovdNumber');
    const alternateOVDOption = document.getElementById('alternateOVDOption');
    const alternateOVDLabel = document.getElementById('alternateOVDLabel');

    if (ovdType) {
        ovdNumberGroup.style.display = 'block';
        
        // Update label and placeholder based on OVD type
        switch(ovdType) {
            case 'aadhar':
                ovdNumberLabel.textContent = 'Aadhar Number';
                ovdNumberInput.placeholder = '123412341234';
                ovdNumberInput.maxLength = '12';
                alternateOVDOption.style.display = 'block';
                alternateOVDLabel.textContent = 'This is not my correct Aadhar Number';
                break;
            case 'passport':
                ovdNumberLabel.textContent = 'Passport Number';
                ovdNumberInput.placeholder = 'A1234567';
                ovdNumberInput.maxLength = '8';
                alternateOVDOption.style.display = 'none';
                break;
            case 'driving_license':
                ovdNumberLabel.textContent = 'Driving License Number';
                ovdNumberInput.placeholder = 'MH0220110012345';
                ovdNumberInput.maxLength = '20';
                alternateOVDOption.style.display = 'none';
                break;
            case 'voter_id':
                ovdNumberLabel.textContent = 'Voter ID Number';
                ovdNumberInput.placeholder = 'ABC1234567';
                ovdNumberInput.maxLength = '10';
                alternateOVDOption.style.display = 'none';
                break;
            case 'pan_card':
                ovdNumberLabel.textContent = 'PAN Number';
                ovdNumberInput.placeholder = 'ABCDE1234F';
                ovdNumberInput.maxLength = '10';
                alternateOVDOption.style.display = 'none';
                break;
        }
        
        // Clear previous values
        ovdNumberInput.value = '';
        document.getElementById('useAlternateOVD').checked = false;
        handleAlternateOVDChange();
    } else {
        ovdNumberGroup.style.display = 'none';
        alternateOVDOption.style.display = 'none';
    }
}

function handleBusinessOVDTypeChange() {
    const ovdType = document.getElementById('businessOVDType').value;
    const ovdNumberGroup = document.getElementById('businessOVDNumberGroup');
    const ovdNumberLabel = document.getElementById('businessOVDNumberLabel');
    const ovdNumberInput = document.getElementById('businessOVDNumber');

    if (ovdType) {
        ovdNumberGroup.style.display = 'block';
        
        // Update label and placeholder based on OVD type
        switch(ovdType) {
            case 'aadhar':
                ovdNumberLabel.textContent = 'Aadhar Number';
                ovdNumberInput.placeholder = '123412341234';
                ovdNumberInput.maxLength = '12';
                break;
            case 'passport':
                ovdNumberLabel.textContent = 'Passport Number';
                ovdNumberInput.placeholder = 'A1234567';
                ovdNumberInput.maxLength = '8';
                break;
            case 'driving_license':
                ovdNumberLabel.textContent = 'Driving License Number';
                ovdNumberInput.placeholder = 'MH0220110012345';
                ovdNumberInput.maxLength = '20';
                break;
            case 'voter_id':
                ovdNumberLabel.textContent = 'Voter ID Number';
                ovdNumberInput.placeholder = 'ABC1234567';
                ovdNumberInput.maxLength = '10';
                break;
            case 'pan_card':
                ovdNumberLabel.textContent = 'PAN Number';
                ovdNumberInput.placeholder = 'ABCDE1234F';
                ovdNumberInput.maxLength = '10';
                break;
        }
        
        // Clear previous values
        ovdNumberInput.value = '';
    } else {
        ovdNumberGroup.style.display = 'none';
    }
}

function handleAlternateOVDChange() {
    const useAlternate = document.getElementById('useAlternateOVD').checked;
    const alternateOVDSection = document.getElementById('alternateOVDSection');
    const alternateOVDNumberGroup = document.getElementById('alternateOVDNumberGroup');
    const ovdNumberGroup = document.getElementById('ovdNumberGroup');
    const ovdNumber = document.getElementById('ovdNumber');
    
    if (useAlternate) {
        // Show alternate OVD section and hide main OVD number field
        alternateOVDSection.style.display = 'block';
        if (ovdNumber) {
            ovdNumber.style.display = 'none';
            ovdNumber.removeAttribute('required');
        }
    } else {
        // Hide alternate OVD section and show main OVD number field
        alternateOVDSection.style.display = 'none';
        alternateOVDNumberGroup.style.display = 'none';
        document.getElementById('alternateOVDType').value = '';
        document.getElementById('alternateOVDNumber').value = '';
        
        if (ovdNumber) {
            ovdNumber.style.display = 'block';
            ovdNumber.setAttribute('required', 'required');
        }
    }
}

function handleAlternateOVDTypeChange() {
    const ovdType = document.getElementById('alternateOVDType').value;
    const ovdNumberGroup = document.getElementById('alternateOVDNumberGroup');
    const ovdNumberLabel = document.getElementById('alternateOVDNumberLabel');
    const ovdNumberInput = document.getElementById('alternateOVDNumber');

    if (ovdType) {
        ovdNumberGroup.style.display = 'block';
        
        // Update label and placeholder based on OVD type
        switch(ovdType) {
            case 'aadhar_card':
                ovdNumberLabel.textContent = 'Aadhar Number';
                ovdNumberInput.placeholder = '123412341234';
                ovdNumberInput.maxLength = '12';
                break;
            case 'passport':
                ovdNumberLabel.textContent = 'Passport Number';
                ovdNumberInput.placeholder = 'A1234567';
                ovdNumberInput.maxLength = '8';
                break;
            case 'driving_license':
                ovdNumberLabel.textContent = 'Driving License Number';
                ovdNumberInput.placeholder = 'MH0220110012345';
                ovdNumberInput.maxLength = '20';
                break;
            case 'voter_id':
                ovdNumberLabel.textContent = 'Voter ID Number';
                ovdNumberInput.placeholder = 'ABC1234567';
                ovdNumberInput.maxLength = '10';
                break;
            case 'pan_card':
                ovdNumberLabel.textContent = 'PAN Number';
                ovdNumberInput.placeholder = 'ABCDE1234F';
                ovdNumberInput.maxLength = '10';
                break;
        }
        
        // Clear previous values
        ovdNumberInput.value = '';
    } else {
        ovdNumberGroup.style.display = 'none';
    }
}

function verifyOVD() {
    const ovdType = document.getElementById('ovdType').value;
    const ovdNumber = document.getElementById('ovdNumber').value.trim();
    const useAlternate = document.getElementById('useAlternateOVD')?.checked;
    
    if (!ovdType) {
        showError('Please select an OVD type first');
        return;
    }
    
    // If using alternate OVD, check alternate fields
    if (useAlternate) {
        const altOvdType = document.getElementById('alternateOVDType').value;
        const altOvdNumber = document.getElementById('alternateOVDNumber').value.trim();
        
        if (!altOvdType || !altOvdNumber) {
            showError('Please complete alternate OVD details');
            return;
        }
        
        // Validate alternate OVD
        let isValid = false;
        switch(altOvdType) {
            case 'aadhar_card':
                isValid = validateAadhar(altOvdNumber);
                break;
            case 'passport':
                isValid = validatePassport(altOvdNumber);
                break;
            case 'driving_license':
                isValid = validateDrivingLicense(altOvdNumber);
                break;
            case 'voter_id':
                isValid = validateVoterID(altOvdNumber);
                break;
            case 'pan_card':
                isValid = validatePAN(altOvdNumber);
                break;
        }
        
        if (!isValid) {
            showError('Please enter a valid alternate document number');
            return;
        }
        
        // Show OTP modal directly for alternate verification
        showOTPModal(formData.mobile || '9876543210');
        return;
    }
    
    if (!ovdNumber) {
        showError('Please enter the document number');
        return;
    }
    
    // Validate based on OVD type
    let isValid = false;
    switch(ovdType) {
        case 'aadhar':
            isValid = validateAadhar(ovdNumber);
            break;
        case 'passport':
            isValid = validatePassport(ovdNumber);
            break;
        case 'driving_license':
            isValid = validateDrivingLicense(ovdNumber);
            break;
        case 'voter_id':
            isValid = validateVoterID(ovdNumber);
            break;
        case 'pan_card':
            isValid = validatePAN(ovdNumber);
            break;
    }
    
    if (!isValid) {
        showError('Please enter a valid document number');
        return;
    }
    
    // Show OVD-specific terms modal
    showOVDTermsModal(ovdType);
}

function verifyBusinessOVD() {
    const ovdType = document.getElementById('businessOVDType').value;
    const ovdNumber = document.getElementById('businessOVDNumber').value.trim();
    
    if (!ovdType) {
        showError('Please select an OVD type first');
        return;
    }
    
    if (!ovdNumber) {
        showError('Please enter the document number');
        return;
    }
    
    // Validate based on OVD type
    let isValid = false;
    switch(ovdType) {
        case 'aadhar':
            isValid = validateAadhar(ovdNumber);
            break;
        case 'passport':
            isValid = validatePassport(ovdNumber);
            break;
        case 'driving_license':
            isValid = validateDrivingLicense(ovdNumber);
            break;
        case 'voter_id':
            isValid = validateVoterID(ovdNumber);
            break;
        case 'pan_card':
            isValid = validatePAN(ovdNumber);
            break;
    }
    
    if (!isValid) {
        showError('Please enter a valid document number');
        return;
    }
    
    // Show OVD-specific terms modal
    showOVDTermsModal(ovdType, true);
}

function showOVDTermsModal(ovdType, isBusiness = false) {
    const modal = document.getElementById('ovdTermsModal');
    const title = document.getElementById('ovdTermsTitle');
    const content = document.getElementById('ovdTermsContent');
    
    // Store the context for later use
    window.currentOVDContext = { ovdType, isBusiness };
    
    // Update title and content based on OVD type
    switch(ovdType) {
        case 'aadhar':
            title.textContent = 'Aadhar Consent and Terms';
            content.innerHTML = `
                <h4>Aadhar Authentication Consent</h4>
                <p><strong>a.</strong> I hereby provide my voluntary consent to TJSB SAHAKARI Bank to use the Aadhaar details provided by me for authentication and agree to the terms and conditions related to Aadhaar consent and updation.</p>
                
                <p><strong>b.</strong> I am aware that there are various alternate options provided by TJSB SAHAKARI Bank ("Bank") for establishing my identity/address proof for opening a Account / Card / Loan / Investment and agree and confirm that for opening the online Account / Card / Loan / Investment variant i.e. the Account / Card / Loan / Investment, I have voluntarily submitted my Aadhaar number to the Bank and hereby give my consent to the Bank:-</p>
                
                <div class="terms-list">
                    <p><strong>(i)</strong> to establish my identity / address proof and verify my mobile number by Aadhaar based authentication system through biometric and/or One Time Pin (OTP) and/or Yes/No authentication and/or any other authentication mechanism) independently or verify the genuineness of the Aadhaar through Quick Response (QR) code or through such other manner as set out by UIDAI or any other law from time to time;</p>
                    <p><strong>(ii)</strong> share my Aadhaar detail with UIDAI, NPCI, concerned regulatory or statutory authorities as any be required under applicable laws.</p>
                    <p><strong>(iii)</strong> to collect, store and use the Aadhaar details for the aforesaid purpose(s) and update my mobile number registered with UIDAI in the bank records for sending SMS alerts/other communications to me.</p>
                </div>

                <p><strong>c.</strong> I hereby also agree with the below terms pertaining to Aadhaar based authentication/verification:</p>
                
                <div class="terms-list">
                    <p><strong>1.</strong> I have been informed that:</p>
                    <p style="margin-left: 20px;"><strong>(a)</strong> upon authentication, UIDAI may share with TJSB SAHAKARI Bank information in nature of my demographic information including photograph, mobile number which TJSB SAHAKARI Bank may use as an identity/address proof for the purpose of account opening;</p>
                    <p style="margin-left: 20px;"><strong>(b)</strong> my Aadhaar details (including my demographic information) shared by UIDAI will not be used for any purpose other than the purpose mentioned above or as per requirements of law;</p>
                    <p style="margin-left: 20px;"><strong>(c)</strong> my biometric information will not be stored by the Bank.</p>
                    
                    <p><strong>2.</strong> I hereby declare that all the above information voluntarily furnished by me is true, correct and complete in all respects.</p>
                    
                    <p><strong>3.</strong> I understand that TJSB SAHAKARI Bank shall be relying upon the information received from UIDAI for processing my Account / Card / Loan / Investment opening formalities.</p>
                    
                    <p><strong>Note:</strong> OTP will be sent to Mobile Number linked with Aadhaar Number.</p>
                </div>
            `;
            break;
        case 'passport':
            title.textContent = 'Passport Verification Terms';
            content.innerHTML = `
                <h4>Passport Verification Consent</h4>
                <p><strong>a.</strong> I hereby provide my voluntary consent to TJSB SAHAKARI Bank to use the Passport details provided by me for identity verification and authentication purposes.</p>
                
                <p><strong>b.</strong> I confirm that the Passport number and details provided are accurate and belong to me. I understand that TJSB SAHAKARI Bank will verify these details through appropriate government databases.</p>
                
                <p><strong>c.</strong> I agree that TJSB SAHAKARI Bank may store and use my Passport details for KYC compliance, regulatory requirements, and account/loan processing purposes.</p>
            `;
            break;
        case 'driving_license':
            title.textContent = 'Driving License Verification Terms';
            content.innerHTML = `
                <h4>Driving License Verification Consent</h4>
                <p><strong>a.</strong> I hereby provide my voluntary consent to TJSB SAHAKARI Bank to use the Driving License details provided by me for identity verification and authentication purposes.</p>
                
                <p><strong>b.</strong> I confirm that the Driving License number and details provided are accurate and belong to me. I understand that TJSB SAHAKARI Bank will verify these details through RTO databases.</p>
                
                <p><strong>c.</strong> I agree that TJSB SAHAKARI Bank may store and use my Driving License details for KYC compliance, regulatory requirements, and account/loan processing purposes.</p>
            `;
            break;
        case 'voter_id':
            title.textContent = 'Voter ID Verification Terms';
            content.innerHTML = `
                <h4>Voter ID Verification Consent</h4>
                <p><strong>a.</strong> I hereby provide my voluntary consent to TJSB SAHAKARI Bank to use the Voter ID details provided by me for identity verification and authentication purposes.</p>
                
                <p><strong>b.</strong> I confirm that the Voter ID number and details provided are accurate and belong to me. I understand that TJSB SAHAKARI Bank will verify these details through Election Commission databases.</p>
                
                <p><strong>c.</strong> I agree that TJSB SAHAKARI Bank may store and use my Voter ID details for KYC compliance, regulatory requirements, and account/loan processing purposes.</p>
            `;
            break;
        case 'pan_card':
            title.textContent = 'PAN Card Verification Terms';
            content.innerHTML = `
                <h4>PAN Card Verification Consent</h4>
                <p><strong>a.</strong> I hereby provide my voluntary consent to TJSB SAHAKARI Bank to use the PAN details provided by me for identity verification and authentication purposes.</p>
                
                <p><strong>b.</strong> I confirm that the PAN number and details provided are accurate and belong to me. I understand that TJSB SAHAKARI Bank will verify these details through Income Tax Department databases.</p>
                
                <p><strong>c.</strong> I agree that TJSB SAHAKARI Bank may store and use my PAN details for KYC compliance, regulatory requirements, and account/loan processing purposes.</p>
            `;
            break;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeOVDTermsModal() {
    const modal = document.getElementById('ovdTermsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function agreeToOVDTerms() {
    const context = window.currentOVDContext;
    if (!context) return;
    
    const { ovdType, isBusiness } = context;
    
    // Close the modal first
    closeOVDTermsModal();
    
    showSuccess(`${ovdType.charAt(0).toUpperCase() + ovdType.slice(1)} terms accepted successfully!`);
    
    // Simulate OTP process for Aadhar, direct verification for others
    if (ovdType === 'aadhar') {
        // Show OTP modal
        const mobileNumber = isBusiness ? 
            document.getElementById('businessMobile')?.value : 
            document.getElementById('mobile')?.value;
        
        if (mobileNumber) {
            // Set global variables to indicate this is OVD verification
            window.otpVerificationType = 'ovd';
            window.otpVerificationContext = isBusiness ? 'business' : 'individual';
            
            setTimeout(() => {
                showOTPModal(mobileNumber);
            }, 1000);
        } else {
            // Direct verification if no mobile number is available
            completeOVDVerification(isBusiness);
        }
    } else {
        // Direct verification for non-Aadhar documents
        showLoading();
        setTimeout(() => {
            hideLoading();
            completeOVDVerification(isBusiness);
        }, 2000);
    }
}

function completeOVDVerification(isBusiness = false) {
    const verifyBtn = isBusiness ? 
        document.getElementById('businessOVDVerifyBtn') : 
        document.getElementById('ovdVerifyBtn');
    
    if (verifyBtn) {
        verifyBtn.textContent = '✓ Verified';
        verifyBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
        verifyBtn.disabled = true;
    }
    
    showSuccess('Document verified successfully!');
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePinCode(pinCode) {
    return /^\d{6}$/.test(pinCode);
}

function validateGSTNumber(gst) {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
}

// UI Helper functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const container = document.querySelector('.step-content:not([style*="display: none"])');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'error-message';
    successDiv.style.backgroundColor = '#d4edda';
    successDiv.style.color = '#155724';
    successDiv.style.borderColor = '#c3e6cb';
    successDiv.textContent = message;

    const container = document.querySelector('.step-content:not([style*="display: none"])');
    if (container) {
        container.insertBefore(successDiv, container.firstChild);
        setTimeout(() => successDiv.remove(), 3000);
    }
}

// Application date setup
function setApplicationDate() {
    const dateElement = document.getElementById('applicationDate');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-IN');
    }
}

// Thank you page functions
function showThankYou() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        currentStep = 7;
        updateStepDisplay();
    }, 2000);
}

// New function for loan acceptance
function acceptLoan() {
    showLoading();

    // Simulate processing
    setTimeout(() => {
        hideLoading();

        // Send notifications
        sendNotifications();

        // Show success message
        showNotification('🎉 Congratulations! Your loan has been approved. Notifications sent to your mobile and email.');

        // Move to thank you page
        setTimeout(() => {
            showThankYou();
        }, 3000);
    }, 2000);
}

// Download loan summary function
function downloadLoanSummary() {
    const loanData = {
        applicantName: formData.fullName || 'N/A',
        mobile: formData.mobile || 'N/A',
        email: formData.email || 'N/A',
        loanAmount: formData.loanAmount || 1000000,
        interestRate: formData.interestRate || 8.5,
        tenure: formData.tenure || 84,
        emi: calculateEMIValue(),
        applicationDate: new Date().toLocaleDateString('en-IN'),
        referenceNumber: 'LA2025082901'
    };

    const summaryText = `
LOAN APPLICATION SUMMARY
========================

Application Reference: ${loanData.referenceNumber}
Application Date: ${loanData.applicationDate}

APPLICANT DETAILS:
- Name: ${loanData.applicantName}
- Mobile: ${loanData.mobile}
- Email: ${loanData.email}

LOAN DETAILS:
- Loan Amount: Rs. ${loanData.loanAmount.toLocaleString('en-IN')}
- Rate of Interest: ${loanData.interestRate}% p.a.
- Tenure: ${loanData.tenure} months
- EMI: Rs. ${loanData.emi.toLocaleString('en-IN')} p.m.

CHARGES:
- Processing Charges: Rs. 1,180
- Login Fee + GST: Rs. 1,180

Status: IN-PRINCIPAL APPROVED

Thank you for choosing FinanceBank!
    `;

    // Create and download file
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan_summary_${loanData.referenceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification('📄 Loan summary downloaded successfully!');
}

// Send notifications function
function sendNotifications() {
    const mobile = formData.mobile || '9876543210';
    const email = formData.email || 'user@example.com';

    // Simulate SMS notification
    console.log(`SMS sent to ${mobile}: 🎉 Congratulations! Your loan application has been approved. Reference: LA2025082901. Visit our branch to complete formalities. - FinanceBank`);

    // Simulate Email notification
    console.log(`Email sent to ${email}: Your loan application has been approved! Please check your application portal for next steps. Reference: LA2025082901`);
}

function restartApplication() {
    if (confirm('Are you sure you want to start a new application? All current data will be lost.')) {
        resetApplication();
    }
}

function downloadSummary() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        alert('Application summary has been downloaded to your device.');
    }, 1500);
}

// Notification functions
function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const messageElement = toast.querySelector('.notification-message');
    const iconElement = toast.querySelector('.notification-icon');

    messageElement.textContent = message;

    // Set icon based on type
    if (type === 'success') {
        iconElement.textContent = '✅';
        toast.style.backgroundColor = '#d4edda';
        toast.style.borderColor = '#c3e6cb';
    } else if (type === 'error') {
        iconElement.textContent = '❌';
        toast.style.backgroundColor = '#f8d7da';
        toast.style.borderColor = '#f5c6cb';
    }

    toast.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const toast = document.getElementById('notificationToast');
    toast.style.display = 'none';
}

// Calculate EMI value for downloads
function calculateEMIValue() {
    const principal = formData.loanAmount || 1000000;
    const rate = (formData.interestRate || 8.5) / 100 / 12;
    const tenure = formData.tenure || 84;

    const emi = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
    return Math.round(emi);
}

// Update loan type button handlers
function updateLoanTypeHandlers() {
    const loanTypeButtons = document.querySelectorAll('.loan-type-btn');
    loanTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const group = this.closest('.selection-group');
            const buttons = group.querySelectorAll('.loan-type-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Handle loan type selection to show/hide sub-type
            if (this.dataset.value === 'vehicle') {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'block';
            } else {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'none';
            }
        });
    });
}

// Call update handlers on DOM load
document.addEventListener('DOMContentLoaded', updateLoanTypeHandlers);



// PDF Preview Functions
function showDocumentPreview(documentId) {
    const document = uploadedDocuments[documentId];
    if (!document || !document.fileURL) {
        showError('Document not found or preview not available');
        return;
    }

    // Store current document ID for download functionality
    window.currentPreviewDocId = documentId;

    const modal = document.getElementById('documentPreviewModal');
    const previewContent = document.getElementById('previewContent');
    const documentTitle = document.getElementById('documentTitle');

    // Set document title
    documentTitle.textContent = document.name;

    // Clear previous content
    previewContent.innerHTML = '';

    if (document.type === 'application/pdf') {
        // For PDF files, embed the PDF viewer with responsive sizing
        const embed = document.createElement('embed');
        embed.src = document.fileURL;
        embed.type = 'application/pdf';
        embed.style.width = '100%';
        embed.style.height = getResponsiveHeight();
        embed.style.borderRadius = '8px';
        embed.style.border = 'none';
        embed.style.minHeight = '400px';
        previewContent.appendChild(embed);
    } else if (document.type.startsWith('image/')) {
        // For image files, show the image with responsive sizing
        const img = document.createElement('img');
        img.src = document.fileURL;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxHeight = getResponsiveHeight();
        img.style.objectFit = 'contain';
        img.style.borderRadius = '8px';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        img.onload = function() {
            console.log('Image loaded successfully');
        };
        img.onerror = function() {
            console.error('Failed to load image');
            previewContent.innerHTML = '<p style="text-align: center; color: #666;">Failed to load image preview</p>';
        };
        previewContent.appendChild(img);
    } else {
        // For other file types, show a message
        const message = document.createElement('div');
        message.className = 'preview-message';
        message.innerHTML = `
            <div class="file-icon">📄</div>
            <h3>${document.name}</h3>
            <p>Preview not available for this file type</p>
            <p>Size: ${(document.size / 1024 / 1024).toFixed(2)} MB</p>
            <p>Click download to view the file</p>
        `;
        previewContent.appendChild(message);
    }

    modal.style.display = 'block';

    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

// Helper function to get responsive height for preview content
function getResponsiveHeight() {
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;

    if (screenWidth <= 480) {
        return Math.max(screenHeight * 0.6, 300) + 'px';
    } else if (screenWidth <= 768) {
        return Math.max(screenHeight * 0.7, 400) + 'px';
    } else {
        return Math.max(screenHeight * 0.75, 500) + 'px';
    }
}

function closeDocumentPreview() {
    const modal = document.getElementById('documentPreviewModal');
    modal.style.display = 'none';

    // Restore body scrolling when modal is closed
    document.body.style.overflow = 'auto';
}

function downloadDocument(documentId) {
    const document = uploadedDocuments[documentId];
    if (!document || !document.fileURL) {
        showError('Document not found');
        return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = document.fileURL;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`📥 ${document.name} downloaded successfully!`);
}

// Document upload preview function
function openDocumentPreview(documentType, fileName, documentId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError('File size should not exceed 5MB');
                return;
            }

            // Get the upload button element
            const uploadBox = document.getElementById(documentId);
            const buttonElement = uploadBox ? uploadBox.querySelector('.upload-btn') : null;

            // Process all documents directly without verification
            processFileUpload(file, documentId, documentType, buttonElement);
        }
    };
    input.click();
}

// Bank verification system
function showBankVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'bankVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeBankVerificationModal()">&times;</span>
            <h3>Bank Account Verification</h3>
            <form id="bankVerificationForm">
                <div class="bank-form-group">
                    <label for="accountNumber">Account Number</label>
                    <input type="text" id="accountNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="confirmAccountNumber">Confirm Account Number</label>
                    <input type="text" id="confirmAccountNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="ifscCode">IFSC Code</label>
                    <input type="text" id="ifscCode" required>
                </div>
                <div class="bank-form-group">
                    <label for="bankName">Bank Name</label>
                    <input type="text" id="bankName" required>
                </div>
                <div class="bank-form-group">
                    <label for="accountHolderName">Account Holder Name</label>
                    <input type="text" id="accountHolderName" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeBankVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyBankAccount()">Verify Account</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeBankVerificationModal() {
    const modal = document.getElementById('bankVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyBankAccount() {
    const accountNumber = document.getElementById('accountNumber').value;
    const confirmAccountNumber = document.getElementById('confirmAccountNumber').value;
    const ifscCode = document.getElementById('ifscCode').value;
    const bankName = document.getElementById('bankName').value;
    const accountHolderName = document.getElementById('accountHolderName').value;

    // Validation
    if (!accountNumber || !confirmAccountNumber || !ifscCode || !bankName || !accountHolderName) {
        showError('Please fill all bank details');
        return;
    }

    if (accountNumber !== confirmAccountNumber) {
        showError('Account numbers do not match');
        return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
        showError('Please enter a valid IFSC code');
        return;
    }

    showLoading();

    // Simulate bank verification
    setTimeout(() => {
        hideLoading();

        // Save bank details
        formData.bankDetails = {
            accountNumber,
            ifscCode,
            bankName,
            accountHolderName,
            verified: true
        };

        showSuccess('Bank account verified successfully!');
        closeBankVerificationModal();

        // Update bank statement upload to show verified status
        const bankStatementBox = document.getElementById('bankStatement');
        if (bankStatementBox) {
            const verifyBtn = bankStatementBox.querySelector('.verify-bank-btn');
            if (verifyBtn) {
                verifyBtn.textContent = '✓ Verified';
                verifyBtn.style.backgroundColor = '#28a745';
                verifyBtn.disabled = true;
            }
        }
    }, 2000);
}

// Dealer Invoice Verification Modal
function showDealerVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'dealerVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeDealerVerificationModal()">&times;</span>
            <h3>Dealer Invoice Verification</h3>
            <form id="dealerVerificationForm">
                <div class="bank-form-group">
                    <label for="dealerName">Dealer Name</label>
                    <input type="text" id="dealerName" required>
                </div>
                <div class="bank-form-group">
                    <label for="invoiceNumber">Invoice Number</label>
                    <input type="text" id="invoiceNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="vehicleModel">Vehicle Model</label>
                    <input type="text" id="vehicleModel" required>
                </div>
                <div class="bank-form-group">
                    <label for="invoiceAmount">Invoice Amount</label>
                    <input type="number" id="invoiceAmount" required>
                </div>
                <div class="bank-form-group">
                    <label for="invoiceDate">Invoice Date</label>
                    <input type="date" id="invoiceDate" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeDealerVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyDealerInvoice()">Verify Invoice</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeDealerVerificationModal() {
    const modal = document.getElementById('dealerVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyDealerInvoice() {
    const dealerName = document.getElementById('dealerName').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const vehicleModel = document.getElementById('vehicleModel').value;
    const invoiceAmount = document.getElementById('invoiceAmount').value;
    const invoiceDate = document.getElementById('invoiceDate').value;

    // Validation
    if (!dealerName || !invoiceNumber || !vehicleModel || !invoiceAmount || !invoiceDate) {
        showError('Please fill all dealer invoice details');
        return;
    }

    showLoading();

    // Simulate dealer verification
    setTimeout(() => {
        hideLoading();

        // Save dealer details
        formData.dealerDetails = {
            dealerName,
            invoiceNumber,
            vehicleModel,
            invoiceAmount,
            invoiceDate,
            verified: true
        };

        showSuccess('Dealer invoice verified successfully!');
        closeDealerVerificationModal();

        // Update dealer invoice upload to show verified status
        const dealerInvoiceBox = document.getElementById('dealerInvoice');
        if (dealerInvoiceBox) {
            const verifyBtn = dealerInvoiceBox.querySelector('.verify-dealer-btn');
            if (verifyBtn) {
                verifyBtn.textContent = '✓ Verified';
                verifyBtn.style.backgroundColor = '#28a745';
                verifyBtn.disabled = true;
            }
        }
    }, 2000);
}

// GST Verification Modal
function showGSTVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'gstVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeGSTVerificationModal()">&times;</span>
            <h3>GST Certificate Verification</h3>
            <form id="gstVerificationForm">
                <div class="bank-form-group">
                    <label for="gstNumber">GST Number</label>
                    <input type="text" id="gstNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="businessName">Business Name</label>
                    <input type="text" id="businessName" required>
                </div>
                <div class="bank-form-group">
                    <label for="businessAddress">Business Address</label>
                    <input type="text" id="businessAddress" required>
                </div>
                <div class="bank-form-group">
                    <label for="gstStatus">GST Status</label>
                    <select id="gstStatus" required>
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeGSTVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyGST()">Verify GST</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeGSTVerificationModal() {
    const modal = document.getElementById('gstVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyGST() {
    const gstNumber = document.getElementById('gstNumber').value;
    const businessName = document.getElementById('businessName').value;
    const businessAddress = document.getElementById('businessAddress').value;
    const gstStatus = document.getElementById('gstStatus').value;

    // Validation
    if (!gstNumber || !businessName || !businessAddress || !gstStatus) {
        showError('Please fill all GST details');
        return;
    }

    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
        showError('Please enter a valid GST number');
        return;
    }

    showLoading();

    // Simulate GST verification
    setTimeout(() => {
        hideLoading();

        // Save GST details
        formData.gstDetails = {
            gstNumber,
            businessName,
            businessAddress,
            gstStatus,
            verified: true
        };

        showSuccess('GST certificate verified successfully!');
        closeGSTVerificationModal();

        // Update GST upload to show verified status
        const gstBox = document.getElementById('gstDoc');
        if (gstBox) {
            const verifyBtn = gstBox.querySelector('.verify-gst-btn');
            if (verifyBtn) {
                verifyBtn.textContent = '✓ Verified';
                verifyBtn.style.backgroundColor = '#28a745';
                verifyBtn.disabled = true;
            }
        }
    }, 2000);
}

// ITR Verification Modal
function showITRVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'itrVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeITRVerificationModal()">&times;</span>
            <h3>ITR Document Verification</h3>
            <form id="itrVerificationForm">
                <div class="bank-form-group">
                    <label for="assessmentYear">Assessment Year</label>
                    <input type="text" id="assessmentYear" required placeholder="e.g., 2023-24">
                </div>
                <div class="bank-form-group">
                    <label for="totalIncome">Total Income</label>
                    <input type="number" id="totalIncome" required>
                </div>
                <div class="bank-form-group">
                    <label for="taxPaid">Tax Paid</label>
                    <input type="number" id="taxPaid" required>
                </div>
                <div class="bank-form-group">
                    <label for="acknowledgmentNumber">Acknowledgment Number</label>
                    <input type="text" id="acknowledgmentNumber" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeITRVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyITR()">Verify ITR</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeITRVerificationModal() {
    const modal = document.getElementById('itrVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyITR() {
    const assessmentYear = document.getElementById('assessmentYear').value;
    const totalIncome = document.getElementById('totalIncome').value;
    const taxPaid = document.getElementById('taxPaid').value;
    const acknowledgmentNumber = document.getElementById('acknowledgmentNumber').value;

    // Validation
    if (!assessmentYear || !totalIncome || !taxPaid || !acknowledgmentNumber) {
        showError('Please fill all ITR details');
        return;
    }

    showLoading();

    // Simulate ITR verification
    setTimeout(() => {
        hideLoading();

        // Save ITR details
        formData.itrDetails = {
            assessmentYear,
            totalIncome,
            taxPaid,
            acknowledgmentNumber,
            verified: true
        };

        showSuccess('ITR document verified successfully!');
        closeITRVerificationModal();

        // Update ITR upload to show verified status
        const itrBox = document.getElementById('itrDoc');
        if (itrBox) {
            const verifyBtn = itrBox.querySelector('.verify-itr-btn');
            if (verifyBtn) {
                verifyBtn.textContent = '✓ Verified';
                verifyBtn.style.backgroundColor = '#28a745';
                verifyBtn.disabled = true;
            }
        }
    }, 2000);
}

// Updated function to show verification popup instead of direct upload
function handleDocumentUpload(documentId) {
    // Map document IDs to their types
    const documentTypeMap = {
        'bankStatement': 'bankStatement',
        'dealerInvoice': 'dealerInvoice', 
        'gstDoc': 'gstDoc',
        'itrDoc': 'itrDoc'
    };
    
    const documentType = documentTypeMap[documentId] || documentId;
    showDocumentVerificationPopup(documentType, documentId);
}

// OTP Verification Functions
let otpTimer;
let otpTimeRemaining = 120; // 2 minutes

function showOTPModal(mobileNumber, verificationType = 'mobile') {
    // Close any existing verification modals first
    closeAllVerificationModals();
    
    const modal = document.getElementById('otpVerificationModal');
    const mobileDisplay = document.getElementById('otpMobileNumber');

    if (mobileDisplay) {
        mobileDisplay.textContent = mobileNumber;
    }
    if (modal) {
        modal.style.display = 'block';
    }

    // Set verification type if not already set (for mobile verification from verify buttons)
    if (!window.otpVerificationType) {
        window.otpVerificationType = verificationType;
    }

    // Start OTP timer
    startOTPTimer();

    // Focus on OTP input with better error handling
    setTimeout(() => {
        const firstOtpInput = document.getElementById('otp1');
        if (firstOtpInput) {
            firstOtpInput.focus();
        }
    }, 100);
}

function closeOTPModal() {
    const modal = document.getElementById('otpVerificationModal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Clear timer
    if (otpTimer) {
        clearInterval(otpTimer);
        otpTimer = null;
    }

    // Reset values with error handling
    const otpInputs = ['otp1', 'otp2', 'otp3', 'otp4', 'otp5', 'otp6'];
    otpInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }
    });
    otpTimeRemaining = 120;
}

function startOTPTimer() {
    const timerDisplay = document.getElementById('otpTimer');
    const resendBtn = document.getElementById('resendOtpBtn');

    otpTimeRemaining = 120;
    resendBtn.disabled = true;
    resendBtn.textContent = 'Resend OTP';

    otpTimer = setInterval(() => {
        otpTimeRemaining--;

        const minutes = Math.floor(otpTimeRemaining / 60);
        const seconds = otpTimeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (otpTimeRemaining <= 0) {
            clearInterval(otpTimer);
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend OTP';
            timerDisplay.textContent = '00:00';
        }
    }, 1000);
}

function resendOTP() {
    const mobileNumber = document.getElementById('otpMobileNumber').textContent;

    showLoading();
    setTimeout(() => {
        hideLoading();
        showSuccess(`New OTP sent to ${mobileNumber}`);
        startOTPTimer();
    }, 1000);
}

function verifyOTP() {
    // Collect values from all 6 individual digit inputs with better error handling
    const otpInputs = ['otp1', 'otp2', 'otp3', 'otp4', 'otp5', 'otp6'];
    const otpValues = otpInputs.map(id => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : '';
    });
    
    const otpInput = otpValues.join('');

    if (!otpInput || otpInput.length !== 6) {
        showError('Please enter all 6 digits of the OTP');
        return;
    }

    // Validate OTP (accept 123456 or any 6-digit number for demo)
    if (!/^\d{6}$/.test(otpInput)) {
        showError('OTP must be 6 digits only');
        return;
    }

    // Accept 123456 as valid OTP for demo
    if (otpInput !== '123456') {
        showError('Invalid OTP. Please enter 123456');
        return;
    }

    showLoading();
    setTimeout(() => {
        hideLoading();

        // Check what type of verification this OTP is for using a global variable
        if (window.otpVerificationType === 'ovd') {
            // This is for OVD verification
            completeOVDVerification(window.otpVerificationContext === 'business');
        } else {
            // This is for mobile verification
            const mobileNumber = document.getElementById('otpMobileNumber').textContent;
            const mobileInputs = document.querySelectorAll('.mobile-input-container input[type="text"]');
            let targetVerifyBtn = null;

            mobileInputs.forEach(input => {
                if (input.value === mobileNumber) {
                    const container = input.closest('.mobile-input-container');
                    targetVerifyBtn = container.querySelector('.verify-btn');
                }
            });

            if (targetVerifyBtn) {
                targetVerifyBtn.textContent = '✓ Verified';
                targetVerifyBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                targetVerifyBtn.disabled = true;
            }

            showSuccess('Mobile number verified successfully!');
        }

        closeOTPModal();
        
        // Clear verification type
        window.otpVerificationType = null;
        window.otpVerificationContext = null;
    }, 1500);
}

// Helper functions for OTP input handling
function moveToNext(currentInput, nextInputId) {
    if (!currentInput) {
        console.error('Current input element is null');
        return;
    }
    
    if (!currentInput.value) {
        return;
    }
    
    // Only allow numeric input
    currentInput.value = currentInput.value.replace(/[^0-9]/g, '');
    
    if (currentInput.value.length === 1 && nextInputId) {
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
            nextInput.focus();
        } else {
            console.error(`Next input element ${nextInputId} not found`);
        }
    }
}

function handleBackspace(currentInput, prevInputId) {
    if (!currentInput) {
        console.error('Current input element is null');
        return;
    }
    
    // Use event parameter from the onkeydown attribute
    if (!window.event && !event) {
        console.error('Event object is null');
        return;
    }
    
    const keyEvent = window.event || event;
    
    if (keyEvent.key === 'Backspace' && currentInput.value.length === 0 && prevInputId) {
        const prevInput = document.getElementById(prevInputId);
        if (prevInput) {
            prevInput.focus();
        } else {
            console.error(`Previous input element ${prevInputId} not found`);
        }
    }
}

// Terms & Conditions Modal Functions
let currentTermsCheckboxId = null;

// Handle terms checkbox clicks - automatically open popup
function handleTermsCheckbox(checkbox, checkboxId) {
    // Prevent the checkbox from being checked immediately
    checkbox.checked = false;
    
    // Store the current checkbox ID
    currentTermsCheckboxId = checkboxId;
    
    // Determine which modal to show based on checkbox type
    if (checkboxId.includes('DirectorDeclaration')) {
        showDirectorTermsModal();
    } else if (checkboxId.includes('Disclosure')) {
        showTermsModal();
    } else if (checkboxId.includes('PersonalTerms')) {
        showPersonalTermsModal();
    } else if (checkboxId.includes('Terms')) {
        showBasicTermsModal();
    }
}

function showTermsModal() {
    const modal = document.getElementById('termsModal');
    modal.style.display = 'block';
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    modal.style.display = 'none';
    
    // Restore body scrolling when modal is closed
    document.body.style.overflow = 'auto';
}

function agreeToTerms() {
    if (currentTermsCheckboxId) {
        const checkbox = document.getElementById(currentTermsCheckboxId);
        const verifiedSpan = document.getElementById(currentTermsCheckboxId + 'Verified');
        
        if (checkbox) {
            checkbox.checked = true;
            if (verifiedSpan) {
                verifiedSpan.style.display = 'inline';
            }
            showSuccess('Terms & Conditions accepted successfully!');
        }
    }
    closeTermsModal();
}

function showDirectorTermsModal() {
    const modal = document.getElementById('directorTermsModal');
    modal.style.display = 'block';
    
    // Determine which checkbox triggered this modal
    const employmentType = formData.employmentType || 'individual';
    currentTermsCheckboxId = employmentType === 'non-individual' ? 'businessAgreeDirectorDeclaration' : 'agreeDirectorDeclaration';
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

function closeDirectorTermsModal() {
    const modal = document.getElementById('directorTermsModal');
    modal.style.display = 'none';
    
    // Restore body scrolling when modal is closed
    document.body.style.overflow = 'auto';
}

function agreeToDirectorTerms() {
    if (currentTermsCheckboxId) {
        const checkbox = document.getElementById(currentTermsCheckboxId);
        const verifiedSpan = document.getElementById(currentTermsCheckboxId + 'Verified');
        
        if (checkbox) {
            checkbox.checked = true;
            if (verifiedSpan) {
                verifiedSpan.style.display = 'inline';
            }
            showSuccess('Director Declaration accepted successfully!');
        }
    }
    closeDirectorTermsModal();
}

// Basic Terms Modal Functions
function showBasicTermsModal() {
    const modal = document.getElementById('basicTermsModal');
    modal.style.display = 'block';
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

function closeBasicTermsModal() {
    const modal = document.getElementById('basicTermsModal');
    modal.style.display = 'none';
    
    // Restore body scrolling when modal is closed
    document.body.style.overflow = 'auto';
}

function agreeToBasicTerms() {
    if (currentTermsCheckboxId) {
        const checkbox = document.getElementById(currentTermsCheckboxId);
        const verifiedSpan = document.getElementById(currentTermsCheckboxId + 'Verified');
        
        if (checkbox) {
            checkbox.checked = true;
            if (verifiedSpan) {
                verifiedSpan.style.display = 'inline';
            }
            showSuccess('Terms & Conditions accepted successfully!');
        }
    }
    closeBasicTermsModal();
}

// Personal Terms Modal Functions for Personal Details section
function showPersonalTermsModal() {
    const modal = document.getElementById('personalTermsModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
    } else {
        console.error('Personal Terms Modal not found');
    }
}

function closePersonalTermsModal() {
    const modal = document.getElementById('personalTermsModal');
    if (modal) {
        modal.style.display = 'none';
        
        // Restore body scrolling when modal is closed
        document.body.style.overflow = 'auto';
    }
}

function agreeToPersonalTerms() {
    if (currentTermsCheckboxId) {
        const checkbox = document.getElementById(currentTermsCheckboxId);
        const verifiedSpan = document.getElementById(currentTermsCheckboxId + 'Verified');
        
        if (checkbox) {
            checkbox.checked = true;
            if (verifiedSpan) {
                verifiedSpan.style.display = 'inline';
            }
            showSuccess('Personal Terms & Conditions accepted successfully!');
        }
    }
    closePersonalTermsModal();
}

// Export functions for global access
window.nextStep = nextStep;
window.prevStep = prevStep;
window.startApplication = startApplication;
window.showLoanSelection = showLoanSelection;
window.showDocumentUpload = showDocumentUpload;
window.showFinalApproval = showFinalApproval;
window.resetApplication = resetApplication;
window.simulateSteps = simulateSteps;
window.showThankYou = showThankYou;
window.restartApplication = restartApplication;
window.downloadSummary = downloadSummary;
window.acceptLoan = acceptLoan;
window.downloadLoanSummary = downloadLoanSummary;
window.hideNotification = hideNotification;

// OVD-related functions
window.handleOVDTypeChange = handleOVDTypeChange;
window.handleBusinessOVDTypeChange = handleBusinessOVDTypeChange;
window.handleAlternateOVDChange = handleAlternateOVDChange;
window.handleAlternateOVDTypeChange = handleAlternateOVDTypeChange;
window.verifyOVD = verifyOVD;
window.verifyBusinessOVD = verifyBusinessOVD;
window.showOVDTermsModal = showOVDTermsModal;
window.closeOVDTermsModal = closeOVDTermsModal;
window.agreeToOVDTerms = agreeToOVDTerms;

window.showDocumentPreview = showDocumentPreview;
window.closeDocumentPreview = closeDocumentPreview;
window.downloadDocument = downloadDocument;
window.openDocumentPreview = openDocumentPreview;
window.handleDocumentUpload = handleDocumentUpload;
window.showOTPModal = showOTPModal;
window.closeOTPModal = closeOTPModal;
window.resendOTP = resendOTP;
window.verifyOTP = verifyOTP;
window.moveToNext = moveToNext;
window.handleBackspace = handleBackspace;
window.showTermsModal = showTermsModal;
window.closeTermsModal = closeTermsModal;
window.agreeToTerms = agreeToTerms;
window.showDirectorTermsModal = showDirectorTermsModal;
window.closeDirectorTermsModal = closeDirectorTermsModal;
window.agreeToDirectorTerms = agreeToDirectorTerms;
