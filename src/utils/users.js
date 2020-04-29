const users = [];

const addUser = ({ id, username, room }) => {
    // Clean the data
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!',
        };
    }

    // Check for existing user
    // existingUser must be empty to prevent duplicates
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username;
    });

    // Validate username
    if (existingUser) {
        return {
            error: 'Username is in use!',
        };
    }

    // Store user
    const user = { id, username, room };
    users.push(user);
    return { user };
};

const removeUser = (id) => {
    // Return -1 if no result found
    const index = users.findIndex((user) => user.id === id);

    if (index !== -1) {
        // Splice allows users to remove an item in an array by their index
        // Remove the first user in an array. We should get only one item, thus the [0]
        return users.splice(index, 1)[0];
    }
};

const getUser = (id) => {
    const user = users.find((user) => user.id === id);
    return user;
};

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase();
    return users.filter((user) => user.room == room);
};

module.exports = { addUser, removeUser, getUser, getUsersInRoom };
