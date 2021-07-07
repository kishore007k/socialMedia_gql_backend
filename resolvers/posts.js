const { AuthenticationError, UserInputError } = require("apollo-server");

const checkAuth = require("../utils/checkAuth");
const PostModels = require("../models/PostModels");

module.exports = {
	Query: {
		getPosts: async (context) => {
			console.log(context);
			try {
				const posts = await PostModels.find().sort({ createdAt: 1 });
				return posts;
			} catch (err) {
				throw new Error(err);
			}
		},

		getPost: async (_, { postId }) => {
			try {
				const post = await PostModels.findById(postId);
				if (post) {
					return post;
				} else {
					throw new Error("Post not found");
				}
			} catch (err) {
				throw new Error(err);
			}
		},
	},

	Mutation: {
		createPost: async (_, { body }, context) => {
			const user = checkAuth(context);

			if (body.trim() === "") {
				throw new Error("Post body must not be empty");
			}

			const newPost = new PostModels({
				body,
				user: user.id,
				userName: user.userName,
				createdAt: new Date().toISOString(),
			});

			const post = await newPost.save();

			context.pubsub.publish("NEW_POST", {
				newPost: post,
			});

			return post;
		},

		deletePost: async (_, { postId }, context) => {
			const user = checkAuth(context);

			try {
				const post = await PostModels.findById(postId);
				if (user.userName === post.userName) {
					await post.delete();
					return "Post deleted successfully";
				} else {
					throw new AuthenticationError("Action not allowed");
				}
			} catch (err) {
				throw new Error(err);
			}
		},

		likePost: async (_, { postId }, context) => {
			const { userName } = checkAuth(context);

			const post = await PostModels.findById(postId);
			if (post) {
				if (post.likes.find((like) => like.userName === userName)) {
					// Post already likes, unlike it
					post.likes = post.likes.filter((like) => like.userName !== userName);
				} else {
					// Not liked, like post
					post.likes.push({
						userName,
						createdAt: new Date().toISOString(),
					});
				}

				await post.save();
				return post;
			} else throw new UserInputError("Post not found");
		},
	},

	Subscription: {
		newPost: {
			subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("NEW_POST"),
		},
	},
};
