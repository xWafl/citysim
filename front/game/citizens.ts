import {Apartment, Blueprint, Building, Farm, Office} from "./buildings";
import {CoalFarm, PowerPlant, SolarPanel, WindTurbine} from "./powerplants";

const skills: Record<Skill, number> = {
    "software": 7,
    "accounting": 10,
    "farming": 4,
    "maintenance": 10,
    "administration": 4,
};

type Skill = "software" | "accounting" | "farming" | "maintenance" | "administration";

class Citizen {
    food: number;
    happiness: number;
    occupation: Office | Farm | PowerPlant | Apartment | null;
    residence: Apartment;

    constructor(public name: string, private money: number, public skill: Skill) {
        this.food = 100;
        this.happiness = 100;
        this.occupation = null;
        this.residence = null;
    }

    getHired(company: Office | Farm) {
        if (company.employed.length < company.maxEmployed) {
            company.hire(this);
        }
    }

    moveIn(location: Apartment) {
        location.accept(this);
    }

    moveOut() {
        this.residence.evict(this);
    }

    payRent() {
        if (this.money > this.residence.rentPrice) {
            this.money -= this.residence.rentPrice;
            this.residence.payRent(this);
        }
    }

    pay(money: number) {
        this.money += money;
    }

    foundApartment() {
        const apartmentBlueprint = new Blueprint ({x:200, y:50, z:200}, 5);
        const newApartment = new Apartment(`${this.name.split(" ")[1]} Apartments`, this, apartmentBlueprint, 500, Number((Math.random() * 3).toFixed(1)), 1000);
        this.occupation = newApartment;
        return newApartment;
    }

    foundOffice(day: number) {
        // 2500 sq ft, a small office.
        const officeBlueprint = new Blueprint({x: 20, y: 20, z: 20}, 2);
        const newOffice = new Office(`${this.name.split(" ")[1]} Inc`, this, officeBlueprint, "software", Math.floor(Math.random() * 100) + 150, 1000, day);
        this.occupation = newOffice;
        return newOffice;
    }

    foundFarm() {
        // 1 acre large
        const farmBluePrint = new Blueprint({x: 660, y: 10, z: 66}, 1);
        const newFarm = new Farm(`${this.name.split(" ")[1]} Farms`, this, farmBluePrint, Math.floor(Math.random() * 20) + 40, 1000);
        this.occupation = newFarm;
        return newFarm;
    }

    foundPowerPlant (type: "coal" | "solar" | "wind" = "coal"): PowerPlant {
        if (type === "coal") {
            const coalBluePrint = new Blueprint({x: 1220, y: 50, z: 660}, 1);
            const newPlant = new CoalFarm(`${this.name.split(" ")[1]} Coalworks`, coalBluePrint);
            this.occupation = newPlant;
            return newPlant;
        } else if (type === "solar") {
            const solarBluePrint = new Blueprint({x: 660, y: 10, z: 66}, 1);
            const newPlant = new SolarPanel(`${this.name.split(" ")[1]} Solar`, solarBluePrint);
            this.occupation = newPlant;
            return newPlant;
        } else if (type === "wind") {
            const windBluePrint = new Blueprint({x: 660, y: 10, z: 66}, 1);
            const newPlant = new WindTurbine(`${this.name.split(" ")[1]} Turbines`, windBluePrint);
            this.occupation = newPlant;
            return newPlant;
        }
    }

    switchJobs (offices: Office[]) {
        if (this.skill !== "administration") {
            if (offices.length > 0 && this.occupation) {
                const highestPayingWorkspace: Office = offices.reduce((acc: Office, cur: Office) => acc.pay > cur.pay ? acc : cur);
                if (highestPayingWorkspace.pay > this.occupation.pay * 1.1) {
                    this.occupation.employed.splice(this.occupation.employed.indexOf(this), 1);
                    this.occupation = null;
                    this.getHired(highestPayingWorkspace);
                }
            }
        }
    }

    switchApartments (apartments: Apartment[]) {
        if (apartments.length > 0 && this.residence) {
            const bestRentApartment: Apartment = apartments.reduce((acc: Apartment, cur: Apartment) => acc.rentPerSqft < cur.rentPerSqft ? acc : cur);
            if (bestRentApartment.rentPerSqft < this.residence.rentPerSqft * 0.9) {
                this.residence.renters.splice(this.residence.renters.indexOf(this), 1);
                this.residence = null;
                this.moveIn(bestRentApartment);
            }
        }
    }
}

export {Citizen, Skill, skills};
