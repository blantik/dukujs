function ContentHandler() {
	var async = require('async');
	var striptags = require('striptags');
	var moment = require('moment');
	var _ = require('underscore');

	// CHECK IS PERMALINK ?
	this.permalink = function(req,res,next) {
		var url = req.originalUrl;
		var id = url.split("_")[1];
		req.url = '/item/' + id;
		next();
	}

	this.checkUri = function(req , res , next ) {
		var url = req.url;
		var pecahanUrl = url.substr(1, url.length).split("/");
		var segment1 = '';
		var segment2 = '';
		var segment3 = '';
		var query = {};
		pecahanUrl.forEach(function (v, i) {
			if (i == 0) {
				segment1 = v;
			}
			if (i == 1) {
				segment2 = v;
			}
			if (i == 2) {
				segment3 = v;
			}
		})

		query.uri = "/" + segment1;

		req.db.findOne('uri', query, function (err, hasil) {
			if (err) console.error(err);
			if (hasil) {
				var ModelSite = req.db.collection('site');
				var ModelLayout = req.db.collection('layout');
				var ModelItem = req.db.collection('contentItem');

				// QUERY ITEM
				var queryItem = {};
				queryItem['$and'] = [];

				var widgetData = [];
				var assetsCss = [];
				var assetsJs = [];

				// GABUNGAN QUERY BERSAMA
				async.parallel([
					function (cb) {
						// MENGUERY DATA SEGMENT
						hasil.segment.forEach(function (doc, i) {
							var object = {};
							var regex = pecahanUrl[i+1];
							object['tag.' + doc.label] = {'$in' : [regex]};

							queryItem['$and'].push(object);
						});
						cb(null, 'Berhasil');
					},
					function (cb) {
						// MENGAMBIL WIDGET DATA
						req.db.find("widgetData", {}, {}, function (err, hasilWidget) {
							widgetData = hasilWidget
							cb(null, "Berhasil");
						})
					},
					function (cb) {
						// MENGAMBIL DATA CSS
						req.db.find("assets", {} , {}, function (err, hasil) {
							hasil.forEach(function (doc) {
								if (doc.type == 'css') {
									assetsCss.push(doc.name.substr(0, doc.name.length-4) + ".min.css");
								}

								if (doc.type == 'js') {
									assetsJs.push(doc.name);
								}
							});
							cb(null, "Berhasil");
						});
					},
					function (cb) {
						req.db.find('contentItem', {}, {}, function(err, hasil) {
							return cb(null, hasil);
						})
					}
				], function (err, hasilGabungan) {
					// MENGAMBIL DATA ITEM DENGAN QUERY YANG SUDAH DI BANGUN UNTUK BOX
					var box = [];
					var dataItem = hasilGabungan[3];
					req.db.find('contentItem', queryItem['$and'].length != 0 ? queryItem : {}, {}, function(err, datanya) {
						// MENGISI BOX YANG ADA DI LAYOUT
						if (err) {
							console.error(new Date(), err);
							next();
						}
						function dynamicSort(property) {
							var sortOrder = 1;
							if(property[0] === "-") {
								sortOrder = -1;
								property = property.substr(1);
							}
							return function (a,b) {
								var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
								return result * sortOrder;
							}
						}

						hasil.box.forEach(function (doc) {
							var dataWidget = req.plugin.customArray.searchObject(doc.widget, widgetData, '_id');
							var tmpDataItem;
							if (dataWidget != undefined) {
								if (segment2 && dataWidget.datauri == true) {
									tmpDataItem = datanya;
								}
								else {
									tmpDataItem = dataItem;
								}
								if (dataWidget.type=='data list') {
									var sortMethod = '';
									if (dataWidget.order.method == "-1") {
										sortMethod = "-";
									}
									else {
										sortMethod = "";
									}
									// WHERE
									var filterData = _.filter(tmpDataItem, function(item) {
										if (item.id_type == dataWidget.contentType) {
											if ((item.tag[dataWidget.label] != null || dataWidget.label == 'all')) {
												return item;
											}
										}
									})
									// TAMPUNG DATA BARU SETELAH FILTER
									tmpDataItem = filterData;
									// SORT
									tmpDataItem.sort(dynamicSort(sortMethod + dataWidget.order.column));
									// LIMIT
									tmpDataItem = tmpDataItem.slice(0, dataWidget.limit!=""?parseInt(dataWidget.limit):tmpDataItem.length);
									if (segment1 == "item" && dataWidget.view == "item_detail") {
										req.db.findOne('contentItem', {id : segment2?segment2:null}, function(err, docItem) {
											var params = [];
											if (docItem) {
												dataWidget.field.forEach(function(field, i) {
													// var tambahan = i < doc.field.length-1 ? "," : "";
													if (field.value == 'editor') {
														params.push(docItem['editor']&&docItem['editor']['content']);
													}
													else if (field.value == 'images') {
														params.push(docItem['images']&&docItem['images'][0]);
													}
													else if (field.value == 'time_added') {
														params.push(moment(docItem[field.value]).format("DD MMMM YYYY HH:mm:ss"))
													}
													else {
														params.push(docItem[field.value]);
													}
												})
												// MENCARI TAG
												var objectID = {
													id : docItem['id'],
													id_type : docItem['id_type'],
													author : docItem['author'],
													tag : _.keys(docItem['tag']),
													keyword : docItem['tag']
												}
												params.push(objectID);

												box.push({
													name : doc.name,
													mixin : dataWidget.view,
													type : 'content',
													params : params
												});
											}
										})
									}
									else if (dataWidget.view == "carousel") {
										var params = [];
										tmpDataItem.forEach(function(data) {
											if (data.tag[dataWidget.label] || dataWidget.label == 'all') {
												var object = {};
												dataWidget.field.forEach(function(field, i) {
													// var tambahan = i < doc.field.length-1 ? "," : "";
													if (field.value == 'editor') {
														// params.push(striptags(data['editor']['content']));
														object[field.value] = striptags(data['editor']['content']);
													}
													else if (field.value == 'images') {
														// params.push(data['images']&&data[field.value][0]);
														object['images'] = data[field.value][0];
													}
													else if (field.value == 'time_added') {
														// params.push(moment(data[field.value]).format("DD MMMM YYYY HH:mm:ss"))
														object[field.value] = moment(data[field.value]).format("DD MMMM YYYY HH:mm:ss");
													}
													else {
														// params.push(data[field.value]);
														object[field.value] = data[field.value];
													}
												})
												params.push(object);
												object = {};
											}
										})
										box.push({
											name : doc.name,
											mixin : dataWidget.view,
											type : 'content',
											params : params
										});
									}
									else {
										tmpDataItem.forEach(function(data) {
											if (data.id_type == dataWidget.contentType) {
												var params = [];
												if ((data.tag[dataWidget.label] || dataWidget.label == 'all') && ((data.tag[dataWidget.label] != undefined && data.tag[dataWidget.label].indexOf(dataWidget.tag) != -1) || dataWidget.tag == 'all' || dataWidget.tag == '')) {
													dataWidget.field.forEach(function(field, i) {
														// var tambahan = i < doc.field.length-1 ? "," : "";
														if (field.value == 'editor') {
															params.push(striptags(data['editor']['content']));
														}
														else if (field.value == 'images') {
															params.push(data['images']&&data[field.value][0]);
														}
														else if (field.value == 'time_added') {
															params.push(moment(data[field.value]).format("DD MMMM YYYY HH:mm:ss"))
														}
														else {
															params.push(data[field.value]);
														}
													})
													var objectID = {
														id : data['id'],
														id_type : data['id_type'],
														id_widget : dataWidget._id
													}
													params.push(objectID);
													// params.push(dataWidget._id);
													box.push({
														name : doc.name,
														type : 'content',
														mixin : dataWidget.view,
														params : params
													});
												}
											}
											// console.log(box);
										})
									}
								}

								// IKI SEG TYPENE HTML
								else if (dataWidget.type == 'html') {
									box.push({
										name : doc.name,
										mixin : 'html',
										type : 'content',
										params : dataWidget.code
									})
								}

								// IKI SEG TYPENE FORM
								else if (dataWidget.type == 'form') {
									req.db.findOne('contentType', {'id' : dataWidget.contentType}, function(err, hasil) {
										if (err) console.error(err);
										if (hasil) {
											box.push({
												name : doc.name,
												type : 'form',
												id_type : hasil.id,
												type_name : hasil.nama,
												component : hasil
											})
										}
									})
								}
								tmpDataItem = [];
							}
						})

						// console.log(box);
						ModelLayout.findOne({ _id : hasil.layout}, function (err, layout) {
							var layoutnya = layout && layout.layout;
							ModelSite.findOne({}, function (err, doc) {
								if (err) console.error(err);
								if (doc) {
									// MEMASUKKAN CSS DI SITE
									doc.css = assetsCss;
									doc.js = assetsJs;
									req.db.find('navigasi', {} , { sort : { 'created_at' : 1 }}, function (err , Navigasi){
										// MULAI RENDER LAYOUT
										req.attach.use(req, function (hasil) {
											res.render('./client/index', {
												headerCode : hasil.header,
												footerCode : hasil.footer,
												site : doc,
												layout : layoutnya,
												// items : dataItem,
												box : box,
												navigasi : Navigasi
											});
										});
									});
								}
							});
						});
					})
				})
			} else {
				return next();
			}
		})
	}

	// PAGINATION
	this.paging = function(req,res,next) {
		var id_type = req.params.content_type;
		var query = req.query;
		var pathurl = req.query.segment.split("/");
		// LIMIT SEMENTARA PATEN YAH
		var offset = parseInt(query.limit) || 0;
		var batas = parseInt(parseInt(query.page||1)-1) * offset;
		// TOTAL DATA
		var totalData = 0;

		var box = [];

		// SEGMENT
		var segment1 = '';
		var segment2 = '';
		var segment3 = '';
		var queryData = {};
		pathurl.forEach(function (v, i) {
			if (i == 1) {
				segment1 = v;
			}
			if (i == 2) {
				segment2 = v;
			}
			if (i == 3) {
				segment3 = v;
			}
		})

		queryData.uri = "/" + segment1;

		async.parallel({
			uri : function(cb) {
				req.db.findOne('uri', queryData, cb);
			},
			widget : function(cb) {
				req.db.findOne('widgetData', {_id : query.widget||null}, cb)
			}
		}, function(err, hasil) {
			var where = {id_type : id_type};
			var label = hasil.widget&&hasil.widget['label'];

			if (label != 'all') {
				if (segment2) {
					where['tag.' + label] = {$in : [segment2]};
				}
				else {
					where['tag.' + label] = {$ne : null};
				}
			}

			// CHECK SEGMENT
			hasil['uri'].segment.forEach(function(doc, i) {
				where['tag.' + doc.label] = {$in : [pathurl[parseInt(i) + 2]]}
			})

			req.db.find('contentItem', where, {sort : {'time_added' : -1}, skip : batas, limit : offset}, function(err, content) {
				if (content) {
					content.forEach(function(docItem) {
						if (hasil['widget'] != null && docItem != null) {
							var params = [];
							if (docItem.tag[hasil['widget']['label']] || hasil['widget']['label'] == 'all') {
								hasil['widget'].field.forEach(function(field, i) {
									// var tambahan = i < doc.field.length-1 ? "," : "";
									if (field.value == 'editor') {
										params.push(striptags(docItem['editor']['content']));
									}
									else if (field.value == 'images') {
										params.push(docItem['images']&&docItem['images'][0]);
									}
									else if (field.value == 'time_added') {
										params.push(moment(docItem[field.value]).format("DD MMMM YYYY HH:mm:ss"))
									}
									else {
										params.push(docItem[field.value]);
									}
								})
								var objectID = {
									id : docItem['id'],
									id_type : docItem['id_type'],
									id_widget : hasil['widget']._id
								}
								params.push(objectID);
								box.push({
									// name : doc.name,
									mixin : hasil['widget'].view,
									params : params
								});							
							}
						}
					})		
				}
				res.json(box);
			});
		})
	}
}
module.exports = ContentHandler;