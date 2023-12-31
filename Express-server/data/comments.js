const mongoCollections = require("../config/mongoCollections");
const comments = mongoCollections.comments;
let { ObjectId } = require("mongodb");

// {
//     id: "1",
//     body: "First comment",
//     username: "Jack",
//     userId: "1",
//     parentId: null,
//     createdAt: "2021-08-16T23:00:33.010+02:00",
//   },

const removeComment = async (commentId) => {
  try {
    const commentsCollection = await comments();
    let commentID_s = commentId;
    commentId = new ObjectId(commentId);

    // Fetch the data first and check if it is a parent Comment or not
    const fetchComment = await commentsCollection.findOne({ _id: commentId });
    if (!fetchComment) {
      throw {
        statusCode: 500,
        error: `Unable to find comment to be deleted from the database`,
      };
    }

    if (fetchComment.parentId === null) {
      const deleteAllChild = await commentsCollection.deleteMany({
        parentId: commentID_s,
      });
    }

    //delete the object with commentId
    const deleteObj = await commentsCollection.deleteOne({ _id: commentId });
    if (deleteObj.deletedCount !== 1) {
      throw {
        statusCode: 500,
        error: `Unable to delete comment from the database`,
      };
    }
  } catch (e) {
    console.log(e);
  }
};

const editComments = async (commentId, text) => {
  try {
    const commentsCollection = await comments();
    commentId = new ObjectId(commentId);

    const updatedObj = await commentsCollection.updateOne(
      { _id: commentId },
      { $set: { body: text } }
    );
    if (updatedObj.modifiedCount === 0) {
      throw {
        statusCode: 500,
        error: `Unable to edit comment value to the database`,
      };
    }

    //fetch again
    const fetchagain = await commentsCollection.findOne({ _id: commentId });
    if (!fetchagain) {
      throw {
        statusCode: 500,
        error: `Unable to fetch updated comment value from the database`,
      };
    }
    fetchagain._id = fetchagain._id.toString();

    return fetchagain;
  } catch (e) {
    console.log(e);
  }
};

const getAllComments = async (movieId) => {
  //validate movieId
  try {
    const commentsCollection = await comments();

    //fetch all the comments with movieId;

    let comment_arr = await commentsCollection
      .find({ movieId: movieId })
      .toArray();
    if (!comment_arr) {
      return {};
    }

    return comment_arr;
  } catch (e) {
    console.log(e);
  }
};

const createParentComment = async (
  movieId,
  userId,
  username,
  body,
  parentId
) => {
  //validate all the inputs here
  try {
    const commentsCollections = await comments();
    const ParentComment = {
      movieId: movieId,
      userId: userId,
      parentId: parentId ? parentId : null,
      username: username,
      body: body,
      createdAt: new Date().toISOString(),
    };
    const insertPComment = await commentsCollections.insertOne(ParentComment);
    if (!insertPComment.acknowledged) {
      throw {
        statusCode: 500,
        error:
          "Internal Server Error: The Comment was not added to the Database",
      };
    }

    //fetch again
    const fetchagain = await commentsCollections.findOne({
      _id: insertPComment.insertedId,
    });
    if (!insertPComment) {
      throw {
        statusCode: 500,
        error:
          "Internal Server Error: could not fetch comment again after adding to the Database",
      };
    }
    fetchagain._id = fetchagain._id.toString();

    return fetchagain;
  } catch (e) {
    console.log(e);
  }
};

const createComment = async (userId, movieId, username, parentId, body) => {
  // validation
  // NOT NULL,string, lenght not zero AFTERN TRIM, 200 WORDS
  try {
    if (parentCommentId != null) {
      await validationFunctions.idValidator(parentCommentId);
      parentCommentId = parentCommentId.trim();
    }
    await validationFunctions.contentValidator(content);

    // Cleaning: Triming data before saving
    userId = userId.trim();
    movieId = movieId.trim();
    content = content.trim();

    // Current timestamp
    timestamp = new Date();

    // If parentComment comes in empty, means this comment is a parent comment itself. So this comment's parent_comment_id will be null.
    if (parentCommentId == null) {
      parentCommentId = null;
    }

    const commentsCollection = await comments();

    // Creating new comment object
    let newComment = {
      userId: ObjectId(userId),
      movieId: ObjectId(movieId),
      user_name: username,
      parent_comment_id: parentCommentId,
      content: content,
      timestamp: timestamp,
    };

    let insertComment = await commentsCollection.insertOne(newComment);

    if (!insertComment.acknowledged) {
      throw {
        statusCode: 500,
        error:
          "Internal Server Error: The Comment was not added to the Database",
      };
    }

    // Now fetch the newly inserted comment and return it to be rendered on page.
    let newCommentID = insertComment.insertedId;

    let getNewComment = await commentsCollection.findOne({
      _id: ObjectId(newCommentID),
    });
    if (!getNewComment) {
      throw { statusCode: 404, error: "Not able to fetch New comment" };
    }

    getNewComment._id = getNewComment._id.toString();
    getNewComment.user_id = getNewComment.user_id.toString();
    return getNewComment;
  } catch (e) {
    console.log(e);
  }
};

// This function get all comments for the particular movie.
const getAllMovieParentComments = async (movieId) => {
  // validation
  try {
    await validationFunctions.idValidator(movieId);

    movieId = movieId.trim();

    let commentsCollection = await comments();
    let commentsList = await commentsCollection
      .find({
        $and: [{ movieId: ObjectId(movieId) }, { parent_comment_id: null }],
      })
      .toArray();

    commentsList.forEach((parentCommentObj) => {
      parentCommentObj._id = parentCommentObj._id.toString();
      parentCommentObj.user_id = parentCommentObj.user_id.toString();
      parentCommentObj.movieId = parentCommentObj.movieId.toString();
    });

    return commentsList;
  } catch (e) {
    console.log(e);
  }
};

// Get All child comment
const getAllChildCommentsThread = async (parentCommentId) => {
  // validation
  try {
    await validationFunctions.idValidator(parentCommentId);

    parentCommentId = parentCommentId.trim();

    let commentsCollection = await comments();
    let commentsList = await commentsCollection
      .find({ parent_comment_id: ObjectId(parentCommentId) })
      .sort({ timestamp: -1 })
      .toArray();

    return commentsList;
  } catch (e) {
    console.log(e);
  }
};

// Delete the comment with provided commentID
const deleteComment = async (commentId) => {
  // validation
  try {
    await validationFunctions.idValidator(commentId);

    commentId = commentId.trim();

    let commentsCollection = await comments();
    let commentData = await commentsCollection.findOne({
      _id: ObjectId(commentId),
    });
    if (!commentData) {
      throw {
        statusCode: 500,
        error:
          "Internal Server Error: The Comment was not found in the Database",
      };
    }

    let deletedComment = await commentsCollection.deleteOne({
      _id: ObjectId(commentId),
    });
    if (deletedComment.deletedCount === 0) {
      throw {
        statusCode: 500,
        error: "Internal Server Error: The Comment could not be deleted",
      };
    }

    return { isDeleted: true };
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  getAllComments,
  createParentComment,
  editComments,
  removeComment,
  createComment,
  getAllMovieParentComments,
  getAllChildCommentsThread,
  deleteComment,
};
