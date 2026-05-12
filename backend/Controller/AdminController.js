import { createAdmin, LoginAdmin, acceptEmployer, deleteEmployer, rejectEmployer, getAllEmployers, getPendingEmployers } from "../Services/ManageEmployer.service.js";
import AppSuccessful from "../Middleware/AppSuccessful.js";
import AppError from "../Middleware/AppError.js";   




export const registerAdmin = async (req, res, next) => {
  try {
    const adminData = req.body;
    const newAdmin = await createAdmin(adminData);

    return res.json(
      new AppSuccessful("Admin registered successfully", 201, newAdmin)
    );
  } catch (error) {
    next(error);
  } 
};

export const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { admin, token } = await LoginAdmin(email, password);
    return res.json(new AppSuccessful("Admin logged in successfully", 200, { admin, token }));
  } catch (error) {
    next(error);
  }
};

export const logoutAdmin = async (req, res, next) => {
  try {
    const {email, password} = req.body;
        res.clearCookie('Authorization', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    }).json(new AppSuccessful("Admin logged out successfully", 200));

    if(!res.clearCookie){
        throw new AppError("Failed to clear cookie",400);
    }
  } catch (error) {
    next(error);
  }
}
export const acceptEmployerController = async (req, res, next) => {
    try {
        const employerId = req.params.id;
        const employer = await acceptEmployer(employerId);
        return res.json(new AppSuccessful("Employer accepted successfully", 200, employer));
    } catch (error) {
        next(error);
      }
}

export const rejectEmployerController = async (req, res, next) => {
    try {
        const employerId = req.params.id;
        const employer = await rejectEmployer(employerId);
        return res.json(new AppSuccessful("Employer rejected successfully", 200, employer));
    }
    catch (error) {
        next(error);
    }
};

export const getPendingEmployersController = async (req, res, next) => {
    try {
        const pendingEmployers = await getPendingEmployers();
        return res.json(new AppSuccessful("Pending employers retrieved successfully", 200, pendingEmployers));
    }
    catch (error) {      
        next(error);
    }
  };

export const getAllEmployersController = async (req, res, next) => {
    try {
        const employers = await getAllEmployers();
        return res.json(new AppSuccessful("Employers retrieved successfully", 200, employers));
    }
    catch (error) {      
        next(error);
    }
  };
    
export const getEmployerByIdController = async (req, res, next) => {
    try {
        const employerId = req.params.id;
        const employer = await getEmployerById(employerId);
        return res.json(new AppSuccessful("Employer retrieved successfully", 200, employer));
    }
    catch (error) {
        next(error);
    }
  }
  
  export const deleteEmployerController = async (req, res, next) => {
    try {       
       const employerId = req.params.id;
        const result = await deleteEmployer(employerId);
        return res.json(new AppSuccessful("Employer deleted successfully", 200, result));
    }
    catch (error) {
        next(error);
    }
  }
