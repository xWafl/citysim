import {Apartment, Blueprint, Building, Farm, Office} from "./buildings";

const skills: Record<Skill, number> = {
    "software": 7,
    "accounting": 10,
    "farming": 4,
    "maintenance": 10,
    "administration": 5,
};

type Skill = "software" | "accounting" | "farming" | "maintenance" | "administration";

class Citizen {
    food: number;
    happiness: number;
    occupation: Office | Farm;
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
        const newFarm = new Farm(`${this.name.split(" ")[1]} Farms`, this, farmBluePrint, Math.floor(Math.random() * 40) + 80, 1000);
        this.occupation = newFarm;
        return newFarm;
    }

    switchJobs (offices: Office[]) {
        if (offices.length > 0 && this.occupation) {
            const highestPayingWorkspace = <Office>offices.reduce((acc: Office, cur: Office) => acc.pay > cur.pay ? acc : cur);
            if (highestPayingWorkspace.pay > this.occupation.pay * 1.1) {
                this.occupation.employed.splice(this.occupation.employed.indexOf(this), 1);
                this.occupation = null;
                this.getHired(highestPayingWorkspace);
            }
        }
    }
}

export {Citizen, Skill, skills};
