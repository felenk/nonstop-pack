var should = require( 'should' );
var _ = require( 'lodash' );
var package = require( '../src/package.js' );
var mkdirp = require( 'mkdirp' );
var rimraf = require( 'rimraf' );
var fs = require( 'fs' );
var path = require( 'path' );
mkdirp( './packages' );

describe( 'when getting package version', function() {
	var result;
	before( function() {
		result = package.getPackageVersion( path.resolve( './proj1~owner2~branch1~0.2.0~5~darwin~OSX~10.9.2~x64.tar.gz' ) );
	} );

	it( 'should parse version correctly', function() {
		result.should.equal( '0.2.0-5' );
	} );
} );

describe( 'when getting list of installed packages', function() {

	describe( 'with no installed packages', function() {
		var result;
		before( function( done ) {
			package.getInstalled( { project: 'proj1' }, './spec/installed/empty' )
				.then( function( version ) {
					result = version;
					done();
				} );
		} );

		it( 'should resolve to undefined', function() {
			should( result ).not.exist;
		} );
	} );

	describe( 'with installed packages', function() {
		var result;
		before( function( done ) {
			package.getInstalled( /.*/, './spec/installed/projects/proj1-owner1-branch1' )
				.then( function( version ) {
					result = version;
					done();
				} );
		} );

		it( 'should return the latest version', function() {
			result.should.equal( '0.0.2-1' );
		} );
	} );

} );

describe( 'when getting list of packages', function() {
	var list;
	before( function( done ) {
		package.getList( './spec/files' )
			.then( function( l ) {
				list = l;
				done();
			} )
			.then( null, function() {
				done();
			} );
	} );

	it( 'should have a complete list of files', function() {
		list.length.should.equal( 24 );
	} );

	describe( 'when finding packages based on operating system', function() {
		var osx = { osName: 'OSX', osVersion: '10.9.2' };
		var ubuntu = { osName: 'ubuntu' };
		var osxMatches, ubuntuMatches;

		before( function() {
			osxMatches = package.find( list, osx );
			ubuntuMatches = package.find( list, ubuntu );
		} );

		it( 'should return correct number of results', function() {
			osxMatches.length.should.equal( 18 );
			ubuntuMatches.length.should.equal( 6 );
		} );

		it( 'should return newest package first', function() {
			osxMatches[ 0 ].version.should.equal( '0.2.0-5' );
			ubuntuMatches[ 0 ].version.should.equal( '0.2.0-4' );
		} );
	} );

	describe( 'when getting term list from packages', function() {
		var terms;

		before( function() {
			terms = package.terms( list );
			_.remove( terms, function( item ) {
				return _.any( item, function( val ) {
					return val === 'path' || val === 'fullPath';
				} );
			} );
			terms.sort();
		} );

		it( 'should return correct list of terms', function() {
			terms.should.eql( [
				{ '0.0.1-5': 'version' },
				{ x64: 'architecture' },
				{ OSX: 'osName' },
				{ darwin: 'platform' },
				{ '1': 'build' },
				{ '0.0.1-1': 'version' },
				{ branch1: 'branch' },
				{ owner1: 'owner' },
				{ proj1: 'project' },
				{ '2': 'build' },
				{ '0.0.1-2': 'version' },
				{ '3': 'build' },
				{ '0.0.1-3': 'version' },
				{ '4': 'build' },
				{ '0.0.1-4': 'version' },
				{ '5': 'build' },
				{ '10.9.2': 'osVersion' },
				{ '0.0.2-1': 'version' },
				{ '0.0.2-2': 'version' },
				{ '0.0.2-3': 'version' },
				{ '14.04LTS': 'osVersion' },
				{ ubuntu: 'osName' },
				{ linux: 'platform' },
				{ '0.1.0-1': 'version' },
				{ '0.1.0-2': 'version' },
				{ branch2: 'branch' },
				{ '0.2.0-1': 'version' },
				{ owner2: 'owner' },
				{ '0.2.0-2': 'version' },
				{ '0.2.0-3': 'version' },
				{ '0.2.0-4': 'version' },
				{ '0.2.0-5': 'version' }
			] );
		} );
	} );

	describe( 'when getting term list from filtered packages', function() {
		var terms;
		var matches;

		before( function() {
			matches = package.find( list, { branch: 'branch2' } );
			terms = package.terms( matches );
			_.remove( terms, function( item ) {
				return _.any( item, function( val ) {
					return val === 'path' || val === 'fullPath';
				} );
			} );
		} );

		it( 'should return correct list of terms', function() {
			terms.should.eql( [
				{ x64: 'architecture' },
				{ '10.9.2': 'osVersion' },
				{ OSX: 'osName' },
				{ darwin: 'platform' },
				{ '2': 'build' },
				{ '0.1.0-2': 'version' },
				{ branch2: 'branch' },
				{ owner1: 'owner' },
				{ proj1: 'project' },
				{ '1': 'build' },
				{ '0.1.0-1': 'version' },
				{ '3': 'build' },
				{ '0.0.2-3': 'version' },
				{ '0.0.2-2': 'version' },
				{ '0.0.2-1': 'version' }
			] );
		} );
	} );

	describe( 'when finding packages based on project-owner-branch', function() {

		var project1 = { project: 'proj1', owner: 'owner1', branch: 'branch1' };
		var	matches;

		before( function() {
			matches = package.find( list, project1 );
		} );

		it( 'should return correct number of results', function() {
			matches.length.should.equal( 10 );
		} );

		it( 'should return newest package first', function() {
			matches[ 0 ].version.should.equal( '0.1.0-2' );
		} );
	} );

	describe( 'when adding a new file', function() {

		var newPackage = 'proj1~owner2~branch1~0.2.1~1~darwin~OSX~10.9.2~x64.tar.gz';
		var project1 = { project: 'proj1', owner: 'owner2', branch: 'branch1', osName: 'OSX' };
		var matches;

		before( function() {
			package.add( './spec/files', list, newPackage );
			matches = package.find( list, project1 );
		} );

		it( 'should include new package in results', function() {
			matches.length.should.equal( 6 );
			matches[ 0 ].version.should.equal( '0.2.1-1' );
		} );
	} );
} );

describe( 'when getting information for new package', function() {
	var info;
	before( function( done ) {
		package.getInfo( 'test', { 
			path: './',
			pack: { 
				pattern: './src/**/*,./node_modules/**/*'
			} }, './' )
		.then( function( result ) {
			info = result;
			done();
		} );
	} );

	it( 'should retrieve correct information', function() {
		// omit file list and values that change due to commits in the repo
		_.omit( info, 'files', 'build', 'commit', 'output', 'version', 'name' ).should.eql( 
			{
				branch: 'master',
				owner: 'arobson',
				pattern: './src/**/*,./node_modules/**/*',
				path: '/git/labs/nonstop/nonstop-pack'
			} );
	} );

	describe( 'when creating package from info', function() {			
		before( function( done ) {
			this.timeout( 10000 );
			package.create( info )
				.then( function() {
					done();
				} )
				.then( null, function( err ) {
					console.log( err.stack );
					done();
				} );
		} );

		it( 'should have created package', function() {
			fs.existsSync( info.output ).should.be.true; // jshint ignore:line
		} );

		after( function( done ) {
			rimraf( './packages', function() {
				done();
			} );
		} );
	} );
} );

describe( 'when getting information for new package using versionFile', function() {
	var info, version;
	before( function( done ) {
		var text = fs.readFileSync( './package.json' );
		var json = JSON.parse( text );
		version = json.version.split( '-' )[ 0 ];

		package.getInfo( 'test', { 
			path: './', 
			versionFile: './package.json',
			pack: { 
				pattern: './src/**/*,./node_modules/**/*'
			} }, './' )
		.then( function( result ) {
			info = result;
			done();
		} );
	} );

	it( 'should retrieve correct information', function() {
		// omit file list and values that change due to commits in the repo
		_.omit( info, 'files', 'build', 'commit', 'output', 'name' ).should.eql( 
			{
				branch: 'master',
				owner: 'arobson',
				version: version,
				pattern: './src/**/*,./node_modules/**/*',
				path: '/git/labs/nonstop/nonstop-pack'
			} );
	} );
} );

describe( 'when unpacking', function() {

	describe( 'with valid package', function() {
		var result;
		before( function( done ) {
			package.unpack( 
				'./spec/files/proj1-owner1-branch2/proj1~owner1~branch2~0.0.2~1~darwin~OSX~10.9.2~x64.tar.gz',
				'./spec/installed/proj1-owner1-branch2/0.0.2-1' )
				.then( function( version ) {
					result = version;
					done();
				} );
		} );

		it( 'should unpack successfully', function() {
			fs.existsSync( './spec/installed/proj1-owner1-branch2/0.0.2-1' ).should.be.true;
		} );

		it( 'should resolve with installed version', function() {
			result.should.equal( '0.0.2-1' );
		} );

		after( function( done ) {
			rimraf( './spec/installed/proj1-owner1-branch2', function() {
				done();
			} );
		} );
	} );

	describe( 'with missing package', function() {
		var result;
		before( function( done ) {
			package.unpack( 
				'./spec/files/proj1-owner1-branch1/proj1~owner1~branch2~0.0.2~1~darwin~OSX~10.9.2~x64.tar.gz',
				'./spec/installed/proj1-owner1-branch2/0.0.2-1' )
				.then( null, function( err ) {
					result = err;
					done();
				} );
		} );

		it( 'should resolve with installed version', function() {
			result.toString().should.equal( 'Error: The artifact file "./spec/files/proj1-owner1-branch1/proj1~owner1~branch2~0.0.2~1~darwin~OSX~10.9.2~x64.tar.gz" could not be found.' );
		} );
	} );
} );

describe( 'when copying uploaded file', function() {

	before( function( done ) {
		fs
			.createReadStream( './spec/files/proj1~owner1~branch2~0.1.0~2~darwin~OSX~10.9.2~x64.tar.gz' )
			.pipe( fs.createWriteStream( './spec/891345iaghakk92thagk.tar.gz' ) )
			.on( 'finish', function() {
				done();
			} );
	} );

	describe( 'with temp file', function() {
		var packages = [];
		before( function( done ) {

			package.copy(
				'./spec/uploads', 
				'./spec/891345iaghakk92thagk.tar.gz',
				'test~arobson~master~0.1.0~1~darwin~any~any~x64.tar.gz',
				packages
			).then( function() { 
				done();
			} );
		} );

		it( 'should copy file to the correct location', function() {
			fs.existsSync( './spec/uploads/test-arobson-master/test~arobson~master~0.1.0~1~darwin~any~any~x64' ).should.be.true;
		} );

		it( 'should add valid package information to package list', function() {
			packages[ 0 ].should.eql( {
				architecture: 'x64',
				branch: 'master',
				build: '1',
				directory: path.resolve( './spec/uploads/test-arobson-master' ),
				file: 'test~arobson~master~0.1.0~1~darwin~any~any~x64.tar.gz',
				fullPath: path.resolve( './spec/uploads/test~arobson~master~0.1.0~1~darwin~any~any~x64.tar.gz' ),
				osName: 'any',
				osVersion: 'any',
				owner: 'arobson',
				path: undefined,
				platform: 'darwin',
				project: 'test',
				relative: 'test-arobson-master',
				version: '0.1.0-1'
			} );
		} );

		after( function( done ) {
			rimraf( './spec/installed/proj1-owner1-branch2', function() {
				done();
			} );
		} );
	} );
} );