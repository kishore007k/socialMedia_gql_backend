const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { UserInputError } = require("apollo-server");
const {
	validateRegisterInput,
	validateLoginInput,
} = require("../utils/validators");

const { SECRET_KEY } = require("../config");
const UserModels = require("../models/UserModels");

const generateToken = (user) => {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			userName: user.userName,
		},
		SECRET_KEY,
		{ expiresIn: "1h" }
	);
};

module.exports = {
	Mutation: {
		register: async (
			_,
			{ registerInput: { userName, email, password, cPassword } }
		) => {
			// Validate user data
			const { valid, errors } = validateRegisterInput(
				userName,
				email,
				password,
				cPassword
			);
			if (!valid) {
				throw new UserInputError("Errors", { errors });
			}
			// TODO: Make sure user doesnt already exist
			const user = await UserModels.findOne({ userName });
			if (user) {
				throw new UserInputError("userName is taken", {
					errors: {
						userName: "This userName is taken",
					},
				});
			}
			// hash password and create an auth token
			password = await bcrypt.hash(password, 12);

			const newUser = new UserModels({
				email,
				userName,
				password,
				createdAt: new Date().toISOString(),
			});

			const res = await newUser.save();

			const token = generateToken(res);

			return {
				...res._doc,
				id: res._id,
				token,
			};
		},

		login: async (_, { userName, password }) => {
			const { errors, valid } = validateLoginInput(userName, password);

			if (!valid) {
				throw new UserInputError("Errors", { errors });
			}

			const user = await UserModels.findOne({ userName });

			if (!user) {
				errors.general = "User not found";
				throw new UserInputError("User not found", { errors });
			}

			const match = await bcrypt.compare(password, user.password);
			if (!match) {
				errors.general = "Wrong credentials";
				throw new UserInputError("Wrong credentials", { errors });
			}

			const token = generateToken(user);

			return {
				...user._doc,
				id: user._id,
				token,
			};
		},
	},
};
