import {
	ChangeDetectionStrategy,
	Component,
	effect,
	inject,
	model, signal,
	ViewEncapsulation,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { asyncComputed } from '@simra/common-utils';
import { Router } from '@angular/router';
import { EPin, MapPage, MapUtils } from '@simra/common-components';
import { RideFacade } from '@simra/ride-domain'
import { firstValueFrom } from 'rxjs';
import { Feature, FeatureCollection, GeoJsonProperties, LineString, Point } from 'geojson';
import { distance } from '@turf/turf';
import * as maplibregl from 'maplibre-gl';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputGroupModule } from 'primeng/inputgroup';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { Dialog } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
	selector: 'lib-map',
	imports: [CommonModule, MapPage, FormsModule, MultiSelectModule, InputGroupModule, Button, InputNumber, Dialog, CheckboxModule],
	templateUrl: './map.component.html',
	styleUrl: './map.component.css'
})
export class RideMapPage {
  private readonly _rideFacade = inject(RideFacade);

  routes: { id: number; label: string }[] = [];
  selectedRouteIds: number[] = [];
  loadedRouteIds: number[] = [];
  readyMap: maplibregl.Map | undefined;

  private rideIds: number[] = [];
  private ridePoints: FeatureCollection<Point>[] = [];
  private matchedRidePoints: FeatureCollection<Point>[] = [];
  private rideEdges: FeatureCollection<LineString>[] = [];
  private rideIntersectionDelays: FeatureCollection<LineString>[] = [];
  private avgEdges: FeatureCollection<LineString> | undefined;
  private avgIntersectionDelays: FeatureCollection<LineString> | undefined;
  private trafficSignals: FeatureCollection<Point> | undefined;
  private trafficSignalClusters: FeatureCollection<Point> | undefined;

  private filterLayers: string[] = []

  osmIdInput!: number;
  rideIdsOsmID: number[] | undefined;
  trafficSignalIdsOsmID: number[] | undefined;
  showRideIdDialog = false;

  showRidePoints: boolean = true;
  showMatchedRidePoints: boolean = true;
  showRideEdges: boolean = true;
  showRideIntersectionDelays: boolean = true;
  showTrafficSignals: boolean = true;
  showAvgSpeeds: boolean = true;
  showAvgIntersectionDelays: boolean = true;
  flyToRide: boolean = true;

  constructor(private cdr: ChangeDetectorRef) {}

  private async loadIds() {
    const ids = await firstValueFrom(this._rideFacade.getIds());
    return ids;
  }

  private async loadRidePoints(ids: number[]) {   
    const allPoints = [];
    for (const id of ids) {
      const points = await firstValueFrom(this._rideFacade.getRidePoints(id));
      allPoints.push(points);
    }
    return allPoints
  }

  private async loadMatchedPoints(ids: number[]) {   
    const allPoints = [];
    for (const id of ids) {
      const points = await firstValueFrom(this._rideFacade.getMatchedPoints(id));
      if (points.features.length === 0) {
        continue;
      }
      let previousPoint: Feature<Point, GeoJsonProperties> = points.features[0];
      const startPoint: Feature<Point, GeoJsonProperties> = points.features[0];
      const startTime = new Date(startPoint.properties?.['timestamp']);
      let edgeDistance = 0;
      let edgeStartTime = startTime;
      for (const point of points.features) {
        if (point.properties) {
          const timestamp = new Date(point.properties['timestamp']);
          const timeSinceStart = Math.abs(timestamp.getTime()-startTime.getTime())/1000;
          point.properties['timeSinceStart'] = timeSinceStart;
          if (timestamp.getTime() != startTime.getTime() && previousPoint.properties) {
            const timePrevious = new Date(previousPoint.properties['timestamp']);
            const distanceInKm = distance(point.geometry, previousPoint.geometry);
            point.properties['timePrevious'] = Math.abs(timestamp.getTime()-timePrevious.getTime())/1000;
            point.properties['distancePrevious'] = distanceInKm * 1000;
            point.properties['km/h'] = distanceInKm / (point.properties['timePrevious']/60/60);
            if (point.properties['edge_id'] != previousPoint.properties['edge_id']) {
              edgeDistance = 0;
              edgeStartTime = timestamp;
            } else {
              edgeDistance += distanceInKm;
            }
            const timeEdge = Math.abs(timestamp.getTime()-edgeStartTime.getTime())/1000;
            if (timeEdge) {
              point.properties['timeEdge'] = timeEdge;
              point.properties['distanceEdge'] = edgeDistance * 1000;
              point.properties['km/hEdge'] = edgeDistance / (timeEdge/60/60);
            }
          }
          previousPoint = point;
        }
      }
      allPoints.push(points);
    }
    return allPoints;
  }

  private async loadEdges(ids: number[]) {   
    const allEdges = [];
    for (const id of ids) {
      const edges = await firstValueFrom(this._rideFacade.getEdges(id));
      allEdges.push(edges);
    }
    return allEdges
  }

  private async loadIntersectionDelays(ids: number[]) {   
    const intersectionDelays = [];
    for (const id of ids) {
      const edges = await firstValueFrom(this._rideFacade.getIntersectionDelays(id));
      intersectionDelays.push(edges);
    }
    return intersectionDelays
  }

  async loadRideIdsAndTrafficSignalsByOsmId () {
    await this.loadTrafficSignalsByOsmId();
    await this.loadRideIdsByOsmId();
    console.log("Finished");
    this.showRideIdDialog = true;
    this.cdr.detectChanges();
  }

  async loadRideIdsByOsmId() {
    if (!this.osmIdInput) {
      console.error("No osmId.")
      return;
    }
    this.rideIdsOsmID = await firstValueFrom(this._rideFacade.getRideIdsByOsmId(this.osmIdInput));
  }

  async loadTrafficSignalsByOsmId() {
    if (!this.osmIdInput) {
      console.error("No osmId.")
      return;
    }
    const trafficSignals = await firstValueFrom(this._rideFacade.getTrafficSignalsByOsmId(this.osmIdInput));
    const trafficSignalIds: number[] = [];
    for (const trafficSignal of trafficSignals.features) {
      if (trafficSignal.properties?.["id"]) {
        trafficSignalIds.push(trafficSignal.properties["id"]);
      }
    }
    this.trafficSignalIdsOsmID = trafficSignalIds;
  }

  private async loadTrafficSignals() {   
    return await firstValueFrom(this._rideFacade.getTrafficSignals());
  }

  private async loadTrafficSignalClusters() {   
    return await firstValueFrom(this._rideFacade.getTrafficSignalClusters());
  }

  private async loadAvgIntersectionDelays() {
    return await firstValueFrom(this._rideFacade.getIntersectionDelaysGroup());
  }

  private displayPoints(points: FeatureCollection<Point>, map: maplibregl.Map, sourceId: string, color: string = '#ff0000ff', width: number = 4) {
    if (points.features.length === 0 || !points.features[0].properties) {
      return;
    }
    map.addSource(sourceId, {
      type: 'geojson',
      data: points,
    });

    map.addLayer({
      id: sourceId + '-layer',
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': width,
        'circle-color': color,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
      },
    });

    map.setLayoutProperty(sourceId + '-layer', 'visibility', 'none');

    map.on('click', sourceId + '-layer', e => {
      const coordinates = e.lngLat;
      const properties = e.features?.[0].properties;
      let html = "";
      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          html += `<b>${key}</b>: ${value}<br>`
        }
      }

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);
    });
  }

  private displayPointArrayWithRideId(rides: FeatureCollection<Point>[], map: maplibregl.Map, sourceId: string, color: string = '#ff0000ff', width: number = 4) {
    for (const ride of rides) {
      if (ride.features.length === 0 || !ride.features[0].properties) {
        continue;
      }
      const sourceIdRide = `${sourceId}-${ride.features[0].properties["ride_id"]}`;
      this.displayPoints(ride, map, sourceIdRide, color, width)
    }
  }

  private displayLineString(lineString: FeatureCollection<LineString>, map: maplibregl.Map, sourceId: string, lineColor: any = '#2c4b1aff', lineWidth: any = 2) {
    if (lineString.features.length === 0 || !lineString.features[0].properties) {
      return;
    }

    
    const startCoordinates = []
    for (let i = 0; i < lineString.features.length; i++) {
      if (lineString.features[i].properties) {
        lineString.features[i].properties["highlight_id"] = i;
        const start = lineString.features[i].geometry.coordinates[0];
        const p: Point = { "type": "Point", "coordinates": start};
        const f: Feature<Point> = {"type": "Feature", "geometry": p, "properties": {
          "highlight_id": i
        }};
        startCoordinates.push(f);
      }
    }
    const startFeature:FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: startCoordinates,
    };

    map.addSource(sourceId, {
      type: 'geojson',
      data: lineString,
    });

    map.addLayer({
      id: sourceId + '-layer',
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': lineColor,
        'line-width': lineWidth,
      },
    });

    map.addLayer({
      id: sourceId + '-highlight',
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#000000ff',
        'line-width': lineWidth,
        'line-gap-width': 4,
      },
      filter: ['==', ['get', 'highlight_id'], '']
    });
    this.filterLayers.push(sourceId + '-highlight');

    map.addSource(sourceId + "start", {
      type: 'geojson',
      data: startFeature,
    });

    map.addLayer({
      id: sourceId + '-start-layer',
      type: 'circle',
      source: sourceId + "start",
      paint: {
        'circle-color': '#000000ff',
        'circle-radius': 7,
      },
      filter: ['==', ['get', 'highlight_id'], '']
    })
    this.filterLayers.push(sourceId + '-start-layer');

    map.setLayoutProperty(sourceId + '-layer', 'visibility', 'none');

    map.on('click', sourceId + '-layer', e => {
      const coordinates = e.lngLat;
      const clickedFeature = e.features?.[0];
      const properties = e.features?.[0].properties;
      let html = "";
      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          html += `<b>${key}</b>: ${value}<br>`
        }
      }
      if (clickedFeature && properties) {
        map.setFilter(sourceId + '-highlight', [
          '==',
          ['get', 'highlight_id'],
          properties['highlight_id']
        ]);

        map.setFilter(sourceId + '-start-layer', [
          '==',
          ['get', 'highlight_id'],
          properties['highlight_id']
        ]);
      }
      

      new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);
    });
  }

  private displayLineStringArrayWithRideId(rides: FeatureCollection<LineString>[], map: maplibregl.Map, sourceId: string, lineColor: any = '#2c4b1aff', lineWidth: any = 2) {
    for (const ride of rides) {
      if (ride.features.length === 0 || !ride.features[0].properties) {
        continue;
      }
      const sourceIdRide = `${sourceId}-${ride.features[0].properties["ride_id"]}`;
      this.displayLineString(ride, map, sourceIdRide, lineColor, lineWidth)
    }
  }

  private async loadAndDisplay(layer: string, map: maplibregl.Map, rideId: number = NaN) {
    switch (layer) {
      case "trafficSignals":
        this.trafficSignals = await this.loadTrafficSignals();
        this.displayPoints(this.trafficSignals, map, layer, "#991fe0d5", 6);
        this.changeVisibility(`trafficSignals-layer`, this.showTrafficSignals);
        break;
      case "avgSpeeds":
        this.avgEdges = await firstValueFrom(this._rideFacade.getAvgSpeeds());
        this.displayLineString(this.avgEdges, map, layer, [
          'interpolate',
          ['linear'],
          ['get', 'avg_speed'],
          0,  '#ff0000',
          10, '#ffa500',
          15, '#ffff00',
          20, '#00ff00'
        ],
        [
          'interpolate',
          ['linear'],
          ['get', 'count'],
          1, 1.0,
          2, 2.0,
          5, 3.0,
          10, 4.0,
          50, 6.0
        ]);
        this.changeVisibility(`avgSpeeds-layer`, this.showAvgSpeeds);
        break;
      case "avgIntersectionDelays":
        this.avgIntersectionDelays = await this.loadAvgIntersectionDelays();
        this.displayLineString(this.avgIntersectionDelays, map, layer, [
            'interpolate',
            ['linear'],
            ['get', 'avg_speed'],
            0,  '#ff0000',
            10, '#ffa500',
            15, '#ffff00',
            20, '#00ff00'
          ],
          [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            1, 1.0,
            2, 2.0,
            5, 3.0,
            10, 4.0,
            50, 6.0
          ]);
        this.changeVisibility(`avgIntersectionDelays-layer`, this.showAvgIntersectionDelays);
        break;
      default:
        console.error(`Unexpected layer: ${layer}`)
    }
  }

  async onMapReady(mlMap: maplibregl.Map) {
    try {
      this.readyMap = mlMap;
      this.loadAndDisplay("trafficSignals", mlMap);
      this.loadAndDisplay("avgSpeeds", mlMap);
      this.loadAndDisplay("avgIntersectionDelays", mlMap);

      this.rideIds = await this.loadIds();      
      for (const id of this.rideIds) {
        this.routes.push({
          id: id,
          label: `${id}`
        })
      }
      
      console.log("Loaded data.");      
    } catch (e) {
      console.error("Error during fetching rides: ", e)
    }
	}

  clearFilter() {
    if (this.readyMap !== undefined) {
      for (const layer of this.filterLayers) {
        this.readyMap.setFilter(layer, [
          '==',
          ['get', 'highlight_id'],
          ""
        ])
      }
    }
  }

  changeVisibility(layerName: string, visible: boolean) {
    if (this.readyMap !== undefined) {
      if (this.readyMap.getLayer(layerName)) {
        this.readyMap.setLayoutProperty(layerName, 'visibility', visible ? 'visible': 'none');
      }
    }
  }

  onShowTrafficSignalsChange() {
    this.changeVisibility("trafficSignals-layer", this.showTrafficSignals);
  }

  onShowAvgSpeedsChange() {
    this.changeVisibility("avgSpeeds-layer", this.showAvgSpeeds);
  }

  onShowAvgIntersectionDelays() {
    this.changeVisibility("avgIntersectionDelays-layer", this.showAvgIntersectionDelays);
  }

  async onRouteSelectionChange() {
    if (this.readyMap !== undefined) {
      const toBeLoadedIds = [];
      for (const route of this.routes) {
        const visibile: boolean = this.selectedRouteIds.includes(route.id);
        if (visibile && !this.loadedRouteIds.includes(route.id)) {
          toBeLoadedIds.push(route.id);
          this.loadedRouteIds.push(route.id);
        }
      }

      if (toBeLoadedIds.length > 0) {
        const newRidePoints = await this.loadRidePoints(toBeLoadedIds);
        this.ridePoints = this.ridePoints.concat(newRidePoints);
        this.displayPointArrayWithRideId(newRidePoints, this.readyMap, "ridePoints", '#007AFF');

        const newMatchedRidePoints = await this.loadMatchedPoints(toBeLoadedIds);
        this.matchedRidePoints = this.matchedRidePoints.concat(newMatchedRidePoints);
        this.displayPointArrayWithRideId(newMatchedRidePoints, this.readyMap, "matchedPoints", '#ff0000ff');

        const newRideEdges = await this.loadEdges(toBeLoadedIds);
        this.rideEdges = this.rideEdges.concat(newRideEdges);
        this.displayLineStringArrayWithRideId(newRideEdges, this.readyMap, "edges", [
            'interpolate',
            ['linear'],
            ['get', 'speed'],
            0,  '#ff0000',
            10, '#ffa500',
            15, '#ffff00',
            20, '#00ff00'
        ]);

        const newRideIntersectionDelays = await this.loadIntersectionDelays(toBeLoadedIds);
        this.rideIntersectionDelays = this.rideIntersectionDelays.concat(newRideIntersectionDelays);
        this.displayLineStringArrayWithRideId(newRideIntersectionDelays, this.readyMap, "intersectionDelays");
      }
      
      for (const route of this.routes) {
        const visibile: boolean = this.selectedRouteIds.includes(route.id);
        this.changeVisibility(`matchedPoints-${route.id}-layer`, visibile && this.showMatchedRidePoints);
        this.changeVisibility(`ridePoints-${route.id}-layer`, visibile && this.showRidePoints);
        this.changeVisibility(`edges-${route.id}-layer`, visibile && this.showRideEdges);
        this.changeVisibility(`intersectionDelays-${route.id}-layer`, visibile && this.showRideIntersectionDelays);
        if (visibile && this.flyToRide) {
          const features = this.ridePoints.filter(f => f.features[0]?.properties?.["ride_id"] === route.id);
          const coordiante = features[0].features[0].geometry.coordinates;
          this.readyMap.flyTo({ center: [coordiante[0], coordiante[1]] });
        }
      }
    }
  }
}