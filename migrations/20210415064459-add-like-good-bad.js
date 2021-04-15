module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    return db.collection('articles').updateMany({}, { $set: { likes: [], good: [], bad: [] } })
  },

  async down(db, client) {
    return db.collection('articles').updateMany({}, { $unset: { likes: null, good: null, bad: null } })
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};
