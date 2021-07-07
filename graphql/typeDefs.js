const { gql } = require("apollo-server");

module.exports = gql`
	type Post {
		id: ID!
		body: String!
		createdAt: String!
		userName: String!
		comments: [Comment]!
		likes: [Like]!
		likeCount: Int!
		commentCount: Int!
	}

	type Comment {
		id: ID!
		createdAt: String!
		userName: String!
		body: String!
	}

	type Like {
		id: ID!
		createdAt: String!
		userName: String!
	}

	type User {
		id: ID!
		email: String!
		token: String!
		userName: String!
		createdAt: String!
	}

	input RegisterInput {
		userName: String!
		password: String!
		cPassword: String!
		email: String!
	}

	type Query {
		getPosts: [Post]
		getPost(postId: ID!): Post
	}

	type Mutation {
		register(registerInput: RegisterInput): User!
		login(userName: String!, password: String!): User!
		createPost(body: String!): Post!
		deletePost(postId: ID!): String!
		createComment(postId: String!, body: String!): Post!
		deleteComment(postId: ID!, commentId: ID!): Post!
		likePost(postId: ID!): Post!
	}

	type Subscription {
		newPost: Post!
	}
`;
